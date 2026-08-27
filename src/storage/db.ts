import { gdb } from "genosdb";

const password = "The liquid solitude meandered abstractly over the glossy manuscript.";

const db = await gdb("nnootteess", {
  password,
  rtc: true,
  sm: {
    superAdmins: [],
  },
  debug: import.meta.env.DEV,
  oplogSize: 500,
});

function _db() {
  return db;
}

function sm() {
  if (!db.sm) {
    throw new Error("sm not initialized");
  }

  return db.sm;
}

export { _db as db, sm };
