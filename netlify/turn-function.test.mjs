import { afterEach, expect, test } from "bun:test";
import turn from "./functions/turn.mjs";

const savedFetch = globalThis.fetch;
const savedEnv = {
  app: process.env.METERED_TURN_APP,
  key: process.env.METERED_TURN_API_KEY,
};

function request(headers = {}) {
  return new Request("https://notes.test/api/turn", { headers });
}

afterEach(() => {
  globalThis.fetch = savedFetch;

  for (const [name, value] of [
    ["METERED_TURN_APP", savedEnv.app],
    ["METERED_TURN_API_KEY", savedEnv.key],
  ]) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

test("rejects cross-site and address-bar requests", async () => {
  expect((await turn(request({ "sec-fetch-site": "cross-site" }))).status).toBe(403);
  expect((await turn(request({ "sec-fetch-site": "none" }))).status).toBe(403);
});

test("allows clients that omit the header", async () => {
  delete process.env.METERED_TURN_APP;
  delete process.env.METERED_TURN_API_KEY;

  expect((await turn(request())).status).toBe(503);
});

test("reports missing configuration", async () => {
  delete process.env.METERED_TURN_APP;
  delete process.env.METERED_TURN_API_KEY;

  const response = await turn(request({ "sec-fetch-site": "same-origin" }));

  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: "turn_not_configured" });
});

test("normalizes the credential payload", async () => {
  process.env.METERED_TURN_APP = "notesx2";
  process.env.METERED_TURN_API_KEY = "secret";

  let called = "";
  globalThis.fetch = async (url) => {
    called = url;

    return Response.json([{ urls: "turn:global.relay.metered.ca:80", username: "u", credential: "c" }]);
  };

  const response = await turn(request({ "sec-fetch-site": "same-origin" }));

  expect(called).toBe("https://notesx2.metered.live/api/v1/turn/credentials?apiKey=secret");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    iceServers: [{ urls: "turn:global.relay.metered.ca:80", username: "u", credential: "c" }],
  });
});
