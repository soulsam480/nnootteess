import { gdb } from "genosdb";
import type * as GDB from "genosdb";

const password = "The liquid solitude meandered abstractly over the glossy manuscript.";

const V_1 = "nnootteess";
const V_2 = "nnootteess_v2";

export interface IDatabaseAPI {
  sm: () => GDB.SecurityManager;
  db: () => GDB.GDB;
}

export const LEGACY_HANDLE = "nnootteess_graph.msgpack";

export async function clearLegacyOPFSEntry() {
  try {
    const root = await navigator.storage.getDirectory();

    await root.removeEntry(LEGACY_HANDLE, { recursive: true });
  } catch {}
}

export async function hasLegacyDB() {
  try {
    const root = await navigator.storage.getDirectory();

    await root.getFileHandle(LEGACY_HANDLE);

    return true;
  } catch {
    return false;
  }
}

const COMMON_CONFIG: GDB.GDBOptions = {
  password,
  rtc: true,
  sm: {
    superAdmins: [],
  },
  debug: import.meta.env.DEV,
  oplogSize: 500,
};

async function openLegacyDb(): Promise<IDatabaseAPI> {
  const { gdb } =
    // @ts-expect-error esm import from url
    (await import("https://cdn.jsdelivr.net/npm/genosdb@0.26.4/dist/index.min.js")) as typeof GDB;

  const db = await gdb(V_1, { ...COMMON_CONFIG, rtc: true });

  return makeAPI(db);
}

function makeAPI(db: GDB.GDB) {
  return {
    db() {
      return db;
    },
    sm() {
      if (!db.sm) {
        throw new Error("sm not initialized");
      }

      return db.sm;
    },
  };
}

const db = await gdb(V_2, {
  ...COMMON_CONFIG,
  sm: {
    superAdmins: [],
    customRoles: {
      guest: { can: ["read", "sync", "write", "link", "delete"] },
      user: { can: ["write", "link", "sync"], inherits: ["guest"] },
    },
  },
});

const { db: _db, sm } = makeAPI(db);

export { _db as db, sm, openLegacyDb };
