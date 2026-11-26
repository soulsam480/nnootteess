const CREDENTIALS_PATH = "/api/v1/turn/credentials";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

function turnHost(app) {
  const host = app.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  return host.includes(".") ? host : `${host}.metered.live`;
}

export default async function turn() {
  const app = process.env.METERED_TURN_APP;
  const apiKey = process.env.METERED_TURN_API_KEY;

  if (!app || !apiKey) {
    return json(503, { error: "turn_not_configured" });
  }

  const url = `https://${turnHost(app)}${CREDENTIALS_PATH}?apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return json(502, { error: `turn_api_${response.status}` });
    }

    const payload = await response.json();
    const iceServers = Array.isArray(payload) ? payload : payload?.iceServers;

    if (!Array.isArray(iceServers) || iceServers.length === 0) {
      return json(502, { error: "turn_api_empty" });
    }

    return json(200, { iceServers });
  } catch (error) {
    console.error("[turn] credential api failed", error);

    return json(502, { error: "turn_api_unreachable" });
  }
}
