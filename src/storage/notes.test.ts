import { expect, mock, test } from "bun:test";
import fixture from "@/storage/fixtures/legacy-sec-v2.json";

const title = { innerText: "" };
(globalThis as { document?: unknown }).document = {
  head: { querySelector: () => title, appendChild: () => {} },
  createElement: () => title,
};

let privateKey: string | null = fixture.privateKey;

const fakeSm = {
  decryptDataForCurrentUser: async (sec: unknown) => {
    if (typeof sec === "string" && sec.includes("aes-gcm-self-ssm-v2")) {
      throw new Error("Unsupported encryption type or incorrect version");
    }

    return { content: "v3 content" };
  },
};

const fakeDb: {
  map: () => Promise<{ results: unknown[] }>;
  get: (id: string, callback?: (node: unknown) => void) => Promise<{ result: unknown; unsubscribe: () => void }>;
} = {
  map: async () => ({ results: [] }),
  get: async () => ({ result: null, unsubscribe: () => {} }),
};

mock.module("@/storage/db", () => ({ db: () => fakeDb, sm: () => fakeSm }));
mock.module("@/storage/user", () => ({
  user: { id: fixture.address, state: "authenticated" },
  getPrivateKey: () => privateKey,
}));
mock.module("@/storage/tabGroups", () => ({ openNote: () => {} }));
mock.module("@/components/commands/state", () => ({ PRIORITY: { regular: 0 } }));
mock.module("~icons/carbon/search", () => ({ default: () => null }));
mock.module("~icons/carbon/document", () => ({ default: () => null }));
mock.module("~icons/carbon/code", () => ({ default: () => null }));

const vue = await import("vue");
mock.module("vue", () => ({ ...vue, onBeforeUnmount: () => {} }));

const { unwrapNote, useNote, LegacyKeyRequiredError, forgetLegacyKey } = await import(
  "@/storage/notes"
);

function node(sec: unknown) {
  return {
    id: "0xabc:note-1",
    value: { name: "A note", type: "note", owner: fixture.address, sec, content: "old" },
  };
}

test("unwrapNote falls back to the v2 reader", async () => {
  forgetLegacyKey();
  privateKey = fixture.privateKey;
  const result = await unwrapNote(node(fixture.sec) as never);

  expect(result.value.content).toBe("hello legacy");
  expect(result.value.sec).toEqual(fixture.plaintext);
});

test("unwrapNote rejects with a clear error when no key is held", async () => {
  forgetLegacyKey();
  privateKey = null;

  expect(unwrapNote(node(fixture.sec) as never)).rejects.toBeInstanceOf(LegacyKeyRequiredError);
});

test("unwrapNote uses the native reader for v3 fields", async () => {
  forgetLegacyKey();
  privateKey = null;
  const result = await unwrapNote(node('{"type":"aes-gcm-self-ssm-v3"}') as never);

  expect(result.value.content).toBe("v3 content");
});

test("useNote keeps the tab open on an initial null from db.get", async () => {
  let removed = false;

  fakeDb.get = async (_id, callback) => {
    callback?.(null);
    return { result: null, unsubscribe: () => {} };
  };

  const view = await useNote("0xabc:note-1", () => {
    removed = true;
  });

  expect(view.note.value).toBeUndefined();
  expect(view.error.value).toBeNull();
  expect(removed).toBe(false);
});
