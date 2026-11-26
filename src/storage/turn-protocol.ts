export function isIceServer(value: unknown): value is RTCIceServer {
  if (!value || typeof value !== "object") {
    return false;
  }

  const { urls } = value as RTCIceServer;

  return (
    (typeof urls === "string" && urls.length > 0) ||
    (Array.isArray(urls) && urls.length > 0 && urls.every((url) => typeof url === "string" && url.length > 0))
  );
}

/**
 * The credential endpoint has returned two shapes in the wild: a bare array of
 * ice servers, and the same array wrapped in `{ iceServers }`.
 */
export function normalizeIceServers(payload: unknown): RTCIceServer[] {
  const wrapped = (payload as { iceServers?: unknown } | null)?.iceServers;
  const list = Array.isArray(payload) ? payload : Array.isArray(wrapped) ? wrapped : wrapped ? [wrapped] : [];

  return list.filter(isIceServer);
}
