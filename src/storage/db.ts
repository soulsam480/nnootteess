import { useStorage } from "@vueuse/core";
import { gdb } from "genosdb";
import type * as GDB from "genosdb";
import { loadTurnConfig } from "@/storage/turn";

const password = "The liquid solitude meandered abstractly over the glossy manuscript.";

const V_2 = "nnootteess_v2";
const DEV = "nnootteess_dev";

export interface IDatabaseAPI {
  sm: () => GDB.SecurityManager;
  db: () => GDB.GDB;
}

export const LEGACY_HANDLE = "nnootteess_graph.msgpack";

export const debugLogging = useStorage("debug_logging", false);

const SIGNALING_RELAYS = [
  "wss://relay.primal.net",
  "wss://nos.lol",
  "wss://relay.nostr.net",
  "wss://offchain.pub",
  "wss://nostr.mom",
  "wss://nostr.bitcoiner.social",
  "wss://nostr.hifish.org",
  "wss://relay.nostr.com",
  "wss://relay.mccormick.cx",
  "wss://yabu.me",
];

const COMMON_CONFIG: GDB.GDBOptions = {
  password,
  sm: {
    superAdmins: [],
    customRoles: {
      guest: {
        can: ["read", "sync", "write", "link", "delete"],
      },
      user: {
        can: ["write", "link", "sync"],
        inherits: ["guest"],
      },
    },
  },
  debug: import.meta.env.DEV || debugLogging.value,
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

try {
  if (localStorage.getItem("gdb_ethereum_material_encrypted_webauthn_v2")) {
    localStorage.setItem("notesx2_legacy_passkey", "1");
  }

  localStorage.removeItem("gdb_ethereum_material_encrypted_webauthn_v2");
  localStorage.removeItem("gdb_webauthn_registration_details_v2");
} catch {}

const turnConfig = await loadTurnConfig();

const db = await gdb(import.meta.env.DEV ? DEV : V_2, {
  ...COMMON_CONFIG,
  rtc: { relayUrls: SIGNALING_RELAYS, turnConfig },
});

const { db: _db, sm } = makeAPI(db);

export { _db as db, sm };
