import { gdb } from "genosdb";
import type * as GDB from "genosdb";

const password = "The liquid solitude meandered abstractly over the glossy manuscript.";

const V_2 = "nnootteess_v2";

export interface IDatabaseAPI {
  sm: () => GDB.SecurityManager;
  db: () => GDB.GDB;
}

export const LEGACY_HANDLE = "nnootteess_graph.msgpack";

const COMMON_CONFIG: GDB.GDBOptions = {
  password,
  rtc: true,
  sm: {
    superAdmins: [],
  },
  debug: import.meta.env.DEV,
  oplogSize: 500,
};

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

export { _db as db, sm };
