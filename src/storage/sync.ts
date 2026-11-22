import type { GDB, RoomChannel, SignedValue } from "genosdb";
import { reactive, readonly, watch, type DeepReadonly } from "vue";
import { db, sm } from "@/storage/db";
import { user } from "@/storage/user";
import {
  MAX_PRESENCE_LABEL,
  acceptPresence,
  deriveSyncStatus,
  isFresh,
  type PresenceEnvelope,
} from "@/storage/sync-protocol";

export type { SyncStatus } from "@/storage/sync-protocol";

export interface SyncPeer {
  readonly id: string;
  readonly label: string;
  readonly rttMs: number | null;
  readonly lastSeenAt: number;
}

export interface SyncSelf {
  readonly id: string;
  readonly label: string;
  readonly vault: string | null;
}

export interface SyncState {
  readonly status: "unavailable" | "signed-out" | "waiting" | "connected";
  readonly self: SyncSelf | null;
  readonly peers: readonly SyncPeer[];
  readonly vaultDeviceCount: number;
  readonly roomPeerCount: number;
  readonly lastError: string | null;
}

interface PresenceRecord {
  peerId: string;
  label: string | null;
  rttMs: number | null;
  lastSeenAt: number;
}

interface ConnectionRecord {
  superpeer: boolean;
  pingedAt: number;
}

const PRESENCE_CHANNEL = "nx2:presence";
const PRESENCE_TTL_MS = 120_000;
const HEARTBEAT_MS = 10_000;
const VERIFY_MAX_AGE_MS = 180_000;
const PING_INTERVAL_MS = 30_000;
const PING_TIMEOUT_MS = 2_000;

type MutableState = { -readonly [K in keyof SyncState]: SyncState[K] };

const state = reactive<MutableState>({
  status: "unavailable",
  self: null,
  peers: [],
  vaultDeviceCount: 0,
  roomPeerCount: 0,
  lastError: null,
});

export const syncState: DeepReadonly<SyncState> = readonly(state);

let generation = 0;
let room: GDB["room"] = null;
let channel: RoomChannel | null = null;
let selfId: string | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let teardown: (() => void) | null = null;
let signing = false;

const connections = new Map<string, ConnectionRecord>();
const presence = new Map<string, PresenceRecord>();

function localLabel(): string {
  const agent = navigator.userAgent;
  const os = agent.includes("Mac OS")
    ? "macOS"
    : agent.includes("Windows")
      ? "Windows"
      : agent.includes("Linux")
        ? "Linux"
        : "Device";
  const browser = agent.includes("Edg/")
    ? "Edge"
    : agent.includes("Chrome/")
      ? "Chrome"
      : agent.includes("Safari/")
        ? "Safari"
        : "Browser";

  return `${os} · ${browser}`.slice(0, MAX_PRESENCE_LABEL);
}

function clearPresence(): void {
  presence.clear();
  state.lastError = null;
}

function refreshState(): void {
  const active = sm().getActiveEthAddress();
  const roomPeerCount = [...connections.values()].filter(
    (connection) => !connection.superpeer,
  ).length;

  state.status = deriveSyncStatus(Boolean(room), active, roomPeerCount);
  state.self = room && selfId ? { id: selfId, label: localLabel(), vault: active } : null;
  state.peers = !active
    ? []
    : [...presence.values()]
        .filter((record) => isFresh(record.lastSeenAt, Date.now(), PRESENCE_TTL_MS))
        .sort(
          (a, b) =>
            (a.label ?? "").localeCompare(b.label ?? "") || a.peerId.localeCompare(b.peerId),
        )
        .map((record) => ({
          id: record.peerId,
          label: record.label ?? "Another tab",
          rttMs: record.rttMs,
          lastSeenAt: record.lastSeenAt,
        }));
  state.vaultDeviceCount = state.peers.length + (room && active ? 1 : 0);
  state.roomPeerCount = roomPeerCount;
}

async function broadcastPresence(): Promise<void> {
  if (signing || !room || !channel || !selfId || connections.size === 0) {
    return;
  }

  const session = generation;
  const activeChannel = channel;
  const addressAtStart = sm().getActiveEthAddress();

  if (!addressAtStart) {
    return;
  }

  signing = true;

  try {
    const envelope = await sm().sign({
      v: 1,
      peer: selfId,
      label: localLabel(),
    });

    if (
      session !== generation ||
      channel !== activeChannel ||
      sm().getActiveEthAddress() !== addressAtStart
    ) {
      return;
    }

    activeChannel.send(envelope as SignedValue<{ v: 1; peer: string; label: string }>);
    state.lastError = null;
  } catch (error) {
    if (session !== generation) {
      return;
    }

    console.warn("[sync] presence publish failed", error);
    state.lastError = "Could not announce this device.";
  } finally {
    if (session === generation) {
      signing = false;
    }
  }
}

function receivePresence(raw: unknown, peerId: string, session: number): void {
  if (session !== generation) {
    return;
  }

  const active = sm().getActiveEthAddress();

  if (!active) {
    clearPresence();
    refreshState();
    return;
  }

  if (!room || !room.getPeers()[peerId]) {
    return;
  }

  const accepted = acceptPresence(
    raw,
    peerId,
    active,
    (envelope, maxAge) => sm().verify(envelope as PresenceEnvelope, maxAge),
    VERIFY_MAX_AGE_MS,
  );

  if (!accepted) {
    if (presence.delete(peerId)) {
      refreshState();
    }

    return;
  }

  const previous = presence.get(peerId);

  presence.set(peerId, {
    peerId,
    label: accepted.label,
    rttMs: previous?.rttMs ?? null,
    lastSeenAt: Date.now(),
  });
  refreshState();
}

async function ping(peerId: string, session: number): Promise<void> {
  if (!room) {
    return;
  }

  const activeRoom = room;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    const result = await Promise.race([
      activeRoom.ping(peerId),
      new Promise<number>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("timeout")), PING_TIMEOUT_MS);
      }),
    ]);

    if (session !== generation) {
      return;
    }

    const record = presence.get(peerId);

    if (!record || !Number.isFinite(result) || result < 0) {
      return;
    }

    record.rttMs = Math.round(result);
    refreshState();
  } catch {
    return;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function reconcileConnections(now: number): void {
  if (!room) {
    return;
  }

  const live = new Set(Object.keys(room.getPeers()));

  for (const id of connections.keys()) {
    if (!live.has(id)) {
      connections.delete(id);
      presence.delete(id);
    }
  }

  for (const id of live) {
    if (!connections.has(id)) {
      connections.set(id, { superpeer: false, pingedAt: now });
    }
  }
}

function measureRtt(now: number, session: number): void {
  if (!room) {
    return;
  }

  for (const record of presence.values()) {
    const connection = connections.get(record.peerId);

    if (!connection || now - connection.pingedAt < PING_INTERVAL_MS) {
      continue;
    }

    connection.pingedAt = now;
    void ping(record.peerId, session);
  }
}

function tick(session: number): void {
  if (session !== generation) {
    return;
  }

  const now = Date.now();

  for (const [peerId, record] of presence) {
    if (!isFresh(record.lastSeenAt, now, PRESENCE_TTL_MS)) {
      presence.delete(peerId);
    }
  }

  if (!sm().getActiveEthAddress()) {
    clearPresence();
  }

  reconcileConnections(now);
  measureRtt(now, session);
  refreshState();
  void broadcastPresence();
}

export function startSync(): () => void {
  if (teardown) {
    return teardown;
  }

  const current = db();

  room = current.room ?? null;
  selfId = current.selfId ?? null;

  if (!room) {
    refreshState();
    return () => {};
  }

  const session = ++generation;
  const activeRoom = room;

  try {
    channel = activeRoom.channel(PRESENCE_CHANNEL);
  } catch (error) {
    console.warn("[sync] presence channel failed", error);
    state.lastError = "Device presence is unavailable.";
  }

  const onJoin = (peerId: string, type?: string) => {
    if (session !== generation) {
      return;
    }

    connections.set(peerId, { superpeer: type === "superpeer", pingedAt: 0 });
    refreshState();
    void broadcastPresence();
    void ping(peerId, session);
  };

  const onLeave = (peerId: string) => {
    if (session !== generation) {
      return;
    }

    connections.delete(peerId);
    presence.delete(peerId);
    refreshState();
  };

  const onMessage = (data: unknown, peerId: string) => {
    receivePresence(data, peerId, session);
  };

  const onVisible = () => {
    if (session === generation && document.visibilityState === "visible") {
      tick(session);
    }
  };

  activeRoom.on("peer:join", onJoin);
  activeRoom.on("peer:leave", onLeave);
  channel?.on("message", onMessage);
  document.addEventListener("visibilitychange", onVisible);

  reconcileConnections(Date.now());

  const stopWatch = watch(
    () => user.id,
    (next, previous) => {
      if (next !== previous) {
        clearPresence();
        refreshState();
        void broadcastPresence();
      }
    },
  );

  const stop = () => {
    if (session !== generation) {
      return;
    }

    generation++;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    stopWatch();
    activeRoom.off("peer:join", onJoin);
    activeRoom.off("peer:leave", onLeave);
    channel?.off("message", onMessage);
    document.removeEventListener("visibilitychange", onVisible);
    connections.clear();
    clearPresence();
    room = null;
    channel = null;
    selfId = null;
    signing = false;
    teardown = null;
    refreshState();
  };

  teardown = stop;
  timer = setInterval(() => tick(session), HEARTBEAT_MS);
  tick(session);

  return stop;
}
