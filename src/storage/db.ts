import { gdb } from "genosdb";
import type * as GDB from "genosdb";

const password = "The liquid solitude meandered abstractly over the glossy manuscript.";

const V_1 = "nnootteess";
const V_2 = "nnootteess_v2";

const COMMON_CONFIG: GDB.GDBOptions = {
  password,
  rtc: true,
  sm: {
    superAdmins: [],
  },
  debug: import.meta.env.DEV,
  oplogSize: 500,
};

async function openLegacyDb() {
  const { gdb } =
    // @ts-expect-error esm import from url
    (await import("https://cdn.jsdelivr.net/npm/genosdb@0.26.4/dist/index.min.js")) as typeof GDB;

  return await gdb(V_1, COMMON_CONFIG);
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

const [db, _legacy] = await Promise.all([
  gdb(V_2, {
    ...COMMON_CONFIG,
    sm: {
      superAdmins: [],
      customRoles: {
        guest: { can: ["sync"] },
        user: { can: ["read", "write", "link", "sync"], inherits: ["guest"] },
      },
    },
  }),
  openLegacyDb(),
]);

const { db: _db, sm } = makeAPI(db);

const legacyDb = makeAPI(_legacy);

export { _db as db, sm, legacyDb };
