export const MAX_PRESENCE_LABEL = 32;

export type SyncStatus = "unavailable" | "signed-out" | "waiting" | "connected";

export function deriveSyncStatus(
  hasRoom: boolean,
  activeAddress: string | null,
  connectedPeerCount: number,
): SyncStatus {
  if (!hasRoom) return "unavailable";
  if (!activeAddress) return "signed-out";
  if (connectedPeerCount === 0) return "waiting";
  return "connected";
}

export interface PresenceBody {
  v: 1;
  peer: string;
  label: string;
}

export interface PresenceEnvelope {
  kind: "app";
  from: string;
  at: number;
  value: PresenceBody;
  signature: string;
}

export interface AcceptedPresence {
  label: string | null;
}

export function sanitizeLabel(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const clean = value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 32);

  return clean.length > 0 ? clean : null;
}

export function parsePresence(raw: unknown): PresenceEnvelope | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const envelope = raw as Partial<PresenceEnvelope>;
  const value = envelope.value as Partial<PresenceBody> | undefined;

  if (
    envelope.kind !== "app" ||
    typeof envelope.from !== "string" ||
    typeof envelope.at !== "number" ||
    !Number.isFinite(envelope.at) ||
    typeof envelope.signature !== "string" ||
    !value ||
    value.v !== 1 ||
    typeof value.peer !== "string" ||
    typeof value.label !== "string"
  ) {
    return null;
  }

  return envelope as PresenceEnvelope;
}

export function isSameUser(author: string | null, active: string | null): boolean {
  if (!author || !active) {
    return false;
  }

  return author.toLowerCase() === active.toLowerCase();
}

export function acceptPresence(
  raw: unknown,
  observedPeerId: string,
  activeAddress: string | null,
  verify: (envelope: PresenceEnvelope, maxAgeMs: number) => string | null,
  maxAgeMs: number,
): AcceptedPresence | null {
  const envelope = parsePresence(raw);

  if (!envelope || envelope.value.peer !== observedPeerId || !activeAddress) {
    return null;
  }

  let author: string | null = null;

  try {
    author = verify(envelope, maxAgeMs);
  } catch {
    author = null;
  }

  if (!isSameUser(author, activeAddress)) {
    return null;
  }

  return { label: sanitizeLabel(envelope.value.label) };
}

export function isFresh(lastSeenAt: number, now: number, ttlMs: number): boolean {
  return now - lastSeenAt <= ttlMs;
}
