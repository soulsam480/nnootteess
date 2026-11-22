import { describe, expect, test } from "bun:test";
import { deflate } from "pako";
import { encode } from "@msgpack/msgpack";
import fixture from "@/storage/fixtures/legacy-sec-v2.json";
import { decryptLegacySec, deriveLegacyKey, hexToBytes, isLegacySec } from "@/storage/legacy-crypto";
import { migrateNotes, type MigrationDeps, type NoteNode } from "@/storage/migration";

const ADDRESS = fixture.address;
const PRIVATE_KEY = fixture.privateKey;
const NOTE_ID = "0xabc:note-1";

function toHex(bytes: Uint8Array): string {
  let out = "0x";

  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, "0");
  }

  return out;
}

async function sealLegacySec(plain: unknown, privateKeyHex: string): Promise<string> {
  const material = await crypto.subtle.importKey("raw", hexToBytes(privateKeyHex), "PBKDF2", false, [
    "deriveKey",
  ]);
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("ssm-encrypt-for-current-user-v1"),
      iterations: 100000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = Uint8Array.from(deflate(encode(plain)));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);

  return JSON.stringify({
    iv: toHex(iv),
    encrypted: toHex(new Uint8Array(encrypted)),
    type: "aes-gcm-self-ssm-v2",
  });
}

function note(sec: unknown, owner: string = ADDRESS, id: string = NOTE_ID): NoteNode {
  return { id, value: { owner, type: "note", sec } };
}

interface Harness extends MigrationDeps {
  store: Map<string, NoteNode>;
  puts: Array<[string, Record<string, unknown>]>;
}

function harness(
  notes: NoteNode[],
  options: { privateKey?: string; onGet?: (call: number) => void } = {},
): Harness {
  const store = new Map(notes.map((n) => [n.id, structuredClone(n)]));
  const puts: Array<[string, Record<string, unknown>]> = [];
  let calls = 0;

  return {
    address: ADDRESS,
    privateKey: options.privateKey ?? PRIVATE_KEY,
    listNotes: async () => [...store.values()].map((n) => structuredClone(n)),
    getNote: async (id) => {
      calls++;
      options.onGet?.(calls);
      const node = store.get(id);
      return node ? structuredClone(node) : null;
    },
    putNote: async (id, value) => {
      puts.push([id, value]);
      store.set(id, { id, value: structuredClone(value) });
    },
    encrypt: async (plain) => JSON.stringify({ type: "aes-gcm-self-ssm-v3", plain }),
    store,
    puts,
  };
}

describe("legacy-crypto", () => {
  test("opens the committed 0.35.2 fixture", async () => {
    const key = await deriveLegacyKey(PRIVATE_KEY);

    expect(await decryptLegacySec(fixture.sec, key)).toEqual(fixture.plaintext);
  });
});

describe("migrateNotes", () => {
  test("reports every note as failed with a wrong key and writes nothing", async () => {
    const h = harness([note(fixture.sec)], { privateKey: `0x${"11".repeat(32)}` });
    const report = await migrateNotes(h);

    expect(report).toEqual({ scanned: 1, migrated: 0, skipped: 0, failed: 1 });
    expect(h.puts).toEqual([]);
  });

  test("skips a note already sealed in v3", async () => {
    const h = harness([note('{"type":"aes-gcm-self-ssm-v3"}')]);
    const report = await migrateNotes(h);

    expect(report).toEqual({ scanned: 1, migrated: 0, skipped: 1, failed: 0 });
    expect(h.puts).toEqual([]);
  });

  test("skips malformed JSON", async () => {
    const h = harness([
      note("{", ADDRESS, "0xabc:bad"),
      note(fixture.sec, ADDRESS, "0xabc:good"),
    ]);
    const report = await migrateNotes(h);

    expect(report).toEqual({ scanned: 2, migrated: 1, skipped: 1, failed: 0 });
  });

  test("skips an unknown envelope type", async () => {
    const h = harness([note('{"type":"other","iv":"0x00","encrypted":"0x00"}')]);
    const report = await migrateNotes(h);

    expect(report.skipped).toBe(1);
    expect(report.migrated).toBe(0);
  });

  test("round trips unicode content", async () => {
    const plain = { content: "日本語 😀" };
    const sec = await sealLegacySec(plain, PRIVATE_KEY);
    const h = harness([note(sec)]);
    const report = await migrateNotes(h);

    expect(report.migrated).toBe(1);
    expect(JSON.parse(h.puts[0][1].sec as string).plain).toEqual(plain);
  });

  test("round trips a 1 MB note", async () => {
    const plain = { content: "x".repeat(1024 * 1024) };
    const sec = await sealLegacySec(plain, PRIVATE_KEY);
    const h = harness([note(sec)]);
    const report = await migrateNotes(h);

    expect(report.migrated).toBe(1);
    expect(JSON.parse(h.puts[0][1].sec as string).plain).toEqual(plain);
  });

  test("skips a note changed between read and write then migrates it", async () => {
    const original = await sealLegacySec({ content: "old" }, PRIVATE_KEY);
    const changed = await sealLegacySec({ content: "new" }, PRIVATE_KEY);
    let h: Harness;

    h = harness([note(original)], {
      onGet: (call) => {
        if (call === 1) {
          h.store.get(NOTE_ID)!.value.sec = changed;
        }
      },
    });

    const report = await migrateNotes(h);

    expect(report.migrated).toBe(1);
    expect(report.skipped).toBe(0);
    expect(JSON.parse(h.puts[0][1].sec as string).plain).toEqual({ content: "new" });
  });

  test("migrates nothing on a second run over the same store", async () => {
    const h = harness([note(fixture.sec)]);

    expect((await migrateNotes(h)).migrated).toBe(1);
    expect(await migrateNotes(h)).toEqual({ scanned: 1, migrated: 0, skipped: 1, failed: 0 });
  });

  test("skips a note owned by another address", async () => {
    const h = harness([note(fixture.sec, "0xdeadbeef")]);
    const report = await migrateNotes(h);

    expect(report).toEqual({ scanned: 1, migrated: 0, skipped: 1, failed: 0 });
    expect(h.puts).toEqual([]);
  });

  test("does not count a write it cannot confirm", async () => {
    const h = harness([note(fixture.sec)]);
    let calls = 0;
    const unconfirmed = {
      ...h,
      getNote: async (id: string) => {
        calls++;
        return calls === 2 ? null : await h.getNote(id);
      },
    };
    const report = await migrateNotes(unconfirmed);

    expect(report.scanned).toBe(report.migrated + report.skipped + report.failed);
    expect(h.puts).toHaveLength(1);
    expect(await migrateNotes(h)).toEqual({ scanned: 1, migrated: 0, skipped: 1, failed: 0 });
  });

  test("converges after a tab closes part way through", async () => {
    const first = await sealLegacySec({ content: "one" }, PRIVATE_KEY);
    const second = await sealLegacySec({ content: "two" }, PRIVATE_KEY);
    const h = harness([
      note(first, ADDRESS, "0xabc:1"),
      note(second, ADDRESS, "0xabc:2"),
    ]);
    let writes = 0;
    const interrupted = {
      ...h,
      putNote: async (id: string, value: Record<string, unknown>) => {
        writes++;

        if (writes === 2) {
          throw new Error("tab closed");
        }

        return await h.putNote(id, value);
      },
    };

    expect(await migrateNotes(interrupted)).toEqual({
      scanned: 2,
      migrated: 2,
      skipped: 0,
      failed: 0,
    });

    expect(await migrateNotes(h)).toEqual({
      scanned: 2,
      migrated: 0,
      skipped: 2,
      failed: 0,
    });
    expect([...h.store.values()].every((n) => !isLegacySec(n.value.sec))).toBe(true);
  });
});
