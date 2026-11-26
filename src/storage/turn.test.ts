import { expect, test } from "bun:test";
import { normalizeIceServers } from "@/storage/turn-protocol";

const server = {
  urls: "turn:global.relay.example:3478",
  username: "user",
  credential: "secret",
};

test("normalizeIceServers accepts both endpoint shapes", () => {
  expect(normalizeIceServers([server])).toEqual([server]);
  expect(normalizeIceServers({ iceServers: [server] })).toEqual([server]);
  expect(normalizeIceServers({ iceServers: server })).toEqual([server]);
});

test("normalizeIceServers rejects malformed entries", () => {
  expect(normalizeIceServers(null)).toEqual([]);
  expect(normalizeIceServers({})).toEqual([]);
  expect(normalizeIceServers({ iceServers: [{ urls: 1 }, { urls: [] }, { urls: "" }] })).toEqual([]);
});

test("normalizeIceServers keeps valid entries next to invalid ones", () => {
  expect(normalizeIceServers([{ urls: null }, server])).toEqual([server]);
});
