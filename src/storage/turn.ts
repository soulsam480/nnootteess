import { reactive } from "vue";
import { normalizeIceServers } from "@/storage/turn-protocol";

/**
 * TURN credentials come from a same-origin endpoint because the shared secret
 * must never reach the browser. The endpoint is optional: without it the app
 * runs STUN-only, exactly as it did before.
 */
const ENDPOINT = "/api/turn";
const TIMEOUT_MS = 2500;
const CACHE_KEY = "nx2_turn";
const CACHE_TTL_MS = 30 * 60 * 1000;

export const turnState = reactive({
  active: false,
});

interface CacheEntry {
  at: number;
  iceServers: RTCIceServer[];
}

function fromCache(): RTCIceServer[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);

    if (!raw) {
      return null;
    }

    const entry = JSON.parse(raw) as CacheEntry;

    if (!Array.isArray(entry.iceServers) || Date.now() - entry.at > CACHE_TTL_MS) {
      return null;
    }

    return entry.iceServers;
  } catch {
    return null;
  }
}

function toCache(iceServers: RTCIceServer[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), iceServers }));
  } catch {}
}

export async function loadTurnConfig(): Promise<RTCIceServer[]> {
  const cached = fromCache();

  if (cached) {
    turnState.active = true;

    return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`turn endpoint returned ${response.status}`);
    }

    const iceServers = normalizeIceServers(await response.json());

    if (iceServers.length === 0) {
      throw new Error("turn endpoint returned no ice servers");
    }

    toCache(iceServers);
    turnState.active = true;

    return iceServers;
  } catch (error) {
    console.warn("[turn] falling back to STUN only", error);

    return [];
  } finally {
    clearTimeout(timer);
  }
}
