import { expect, test } from "bun:test";
import {
  acceptPresence,
  deriveSyncStatus,
  isFresh,
  isSameUser,
  parsePresence,
  sanitizeLabel,
  type PresenceEnvelope,
} from "@/storage/sync-protocol";

const peerId = "PEER-123";
const active = "0xABCdef";
const envelope: PresenceEnvelope = {
  kind: "app",
  from: active,
  at: Date.now(),
  value: { v: 1, peer: peerId, label: "MacBook" },
  signature: "sig",
};

const verify = () => active;

test("parsePresence rejects malformed envelopes", () => {
  expect(parsePresence(null)).toBeNull();
  expect(parsePresence({ kind: "app" })).toBeNull();
  expect(parsePresence({ ...envelope, value: { ...envelope.value, v: 2 } })).toBeNull();
  expect(parsePresence(envelope)).toEqual(envelope);
});

test("acceptPresence binds the envelope to the observed peer", () => {
  expect(acceptPresence(envelope, peerId, active, verify, 60_000)).toEqual({ label: "MacBook" });
  expect(acceptPresence(envelope, "OTHER", active, verify, 60_000)).toBeNull();
});

test("acceptPresence rejects another user and a failed verification", () => {
  expect(acceptPresence(envelope, peerId, "0x999999", verify, 60_000)).toBeNull();
  expect(acceptPresence(envelope, peerId, active, () => null, 60_000)).toBeNull();
});

test("acceptPresence tolerates verify throwing", () => {
  const throwing = () => {
    throw new Error("bad envelope");
  };

  expect(acceptPresence(envelope, peerId, active, throwing, 60_000)).toBeNull();
});

test("isSameUser compares addresses case insensitively", () => {
  expect(isSameUser("0xabc", "0xABC")).toBe(true);
  expect(isSameUser(null, active)).toBe(false);
  expect(isSameUser("0xabc", "0xdef")).toBe(false);
});

test("sanitizeLabel strips controls, trims, and caps length", () => {
  expect(sanitizeLabel("  Mac\u0000Book  ")).toBe("MacBook");
  expect(sanitizeLabel("x".repeat(80))).toHaveLength(32);
  expect(sanitizeLabel("   ")).toBeNull();
  expect(sanitizeLabel(42)).toBeNull();
});

test("isFresh expires a presence record", () => {
  expect(isFresh(1000, 10_000, 5_000)).toBe(false);
  expect(isFresh(6000, 10_000, 5_000)).toBe(true);
});

test("deriveSyncStatus separates room, auth, and peer state", () => {
  expect(deriveSyncStatus(false, active, 3)).toBe("unavailable");
  expect(deriveSyncStatus(true, null, 3)).toBe("signed-out");
  expect(deriveSyncStatus(true, active, 0)).toBe("waiting");
  expect(deriveSyncStatus(true, active, 1)).toBe("connected");
});

test("acceptPresence rejects a claim without an active vault", () => {
  expect(acceptPresence(envelope, peerId, null, verify, 60_000)).toBeNull();
});

test("acceptPresence passes the verification age to verify", () => {
  let seenAge = 0;

  acceptPresence(
    envelope,
    peerId,
    active,
    (_envelope, age) => {
      seenAge = age;
      return active;
    },
    90_000,
  );

  expect(seenAge).toBe(90_000);
});
