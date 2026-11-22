import { expect, test } from "bun:test";
import type { GDB, QueryOptions, SecurityManager } from "genosdb";
import fixture from "@/storage/fixtures/legacy-sec-v2.json";
import {
  migrateNotesForCurrentUser,
  migrationStatus,
  noteQuery,
  type NoteNode,
} from "@/storage/migration";

function fakeDb(notes: NoteNode[]) {
  const store = new Map(notes.map((n) => [n.id, structuredClone(n)]));
  const puts: Array<[string, Record<string, unknown>]> = [];
  const queries: QueryOptions[] = [];

  const db = {
    map: async (query: QueryOptions) => {
      queries.push(query);
      return { results: [...store.values()].map((n) => structuredClone(n)) };
    },
    get: async (id: string) => {
      const node = store.get(id);
      return { result: node ? structuredClone(node) : null };
    },
    put: async (value: Record<string, unknown>, id?: string) => {
      const key = id ?? "new";
      puts.push([key, value]);
      store.set(key, { id: key, value: structuredClone(value) });
      return key;
    },
  } as unknown as GDB;

  return { db, puts, queries, store };
}

const sm = {
  encryptDataForCurrentUser: async () => '{"type":"aes-gcm-self-ssm-v3"}',
} as unknown as SecurityManager;

test("noteQuery filters notes by owner and sorts by creation time", () => {
  expect(noteQuery(fixture.address)).toEqual({
    query: { type: { $in: ["note", "code"] }, owner: fixture.address },
    field: "created_at",
    order: "desc",
  });
});

test("migrateNotesForCurrentUser writes the v3 field to the same node", async () => {
  const { db, puts, queries } = fakeDb([
    { id: "0xabc:note-1", value: { owner: fixture.address, sec: fixture.sec } },
  ]);
  const report = await migrateNotesForCurrentUser({
    db,
    sm,
    address: fixture.address,
    privateKey: fixture.privateKey,
  });

  expect(report).toEqual({ scanned: 1, migrated: 1, skipped: 0, failed: 0 });
  expect(queries).toEqual([noteQuery(fixture.address)]);
  expect(puts[0][0]).toBe("0xabc:note-1");
  expect(puts[0][1].owner).toBe(fixture.address);
  expect(puts[0][1].sec).toBe('{"type":"aes-gcm-self-ssm-v3"}');
});

test("a second run skips every v3 note", async () => {
  const { db, puts } = fakeDb([
    { id: "0xabc:note-1", value: { owner: fixture.address, sec: fixture.sec } },
  ]);
  const deps = { db, sm, address: fixture.address, privateKey: fixture.privateKey };

  expect((await migrateNotesForCurrentUser(deps)).migrated).toBe(1);
  expect(await migrateNotesForCurrentUser(deps)).toEqual({
    scanned: 1,
    migrated: 0,
    skipped: 1,
    failed: 0,
  });
  expect(puts).toHaveLength(1);
});

test("migrationStatus reflects a clean run and a failed run", async () => {
  const clean = fakeDb([
    { id: "0xabc:note-1", value: { owner: fixture.address, sec: fixture.sec } },
  ]);

  await migrateNotesForCurrentUser({
    db: clean.db,
    sm,
    address: fixture.address,
    privateKey: fixture.privateKey,
  });
  expect(migrationStatus.value).toBe("done");

  const failed = fakeDb([
    { id: "0xabc:note-1", value: { owner: fixture.address, sec: fixture.sec } },
  ]);

  await migrateNotesForCurrentUser({
    db: failed.db,
    sm,
    address: fixture.address,
    privateKey: `0x${"22".repeat(32)}`,
  });
  expect(migrationStatus.value).toBe("failed");
});

test("a note that fails to open stays in the graph untouched", async () => {
  const { db, puts, store } = fakeDb([
    { id: "0xabc:note-1", value: { owner: fixture.address, sec: fixture.sec } },
  ]);
  const report = await migrateNotesForCurrentUser({
    db,
    sm,
    address: fixture.address,
    privateKey: `0x${"22".repeat(32)}`,
  });

  expect(report).toEqual({ scanned: 1, migrated: 0, skipped: 0, failed: 1 });
  expect(puts).toEqual([]);
  expect(store.get("0xabc:note-1")!.value.sec).toBe(fixture.sec);
});
