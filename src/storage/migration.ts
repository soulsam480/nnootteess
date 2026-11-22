import type { GDB, SecurityManager } from "genosdb";
import { ref } from "vue";
import { decryptLegacySec, deriveLegacyKey, isLegacySec } from "@/storage/legacy-crypto";
import { noteQuery } from "@/storage/note-query";

export { noteQuery };

export type MigrationStatus = "idle" | "running" | "done" | "failed";

export const migrationStatus = ref<MigrationStatus>("idle");
export const migrationFailures = ref(0);

export interface NoteNode {
  id: string;
  value: Record<string, unknown>;
}

export interface MigrationDeps {
  address: string;
  privateKey: string;
  listNotes: () => Promise<NoteNode[]>;
  getNote: (id: string) => Promise<NoteNode | null>;
  putNote: (id: string, value: Record<string, unknown>) => Promise<unknown>;
  encrypt: (plain: unknown) => Promise<string>;
}

export interface MigrationReport {
  scanned: number;
  migrated: number;
  skipped: number;
  failed: number;
}

export async function migrateNotes(deps: MigrationDeps): Promise<MigrationReport> {
  const report: MigrationReport = { scanned: 0, migrated: 0, skipped: 0, failed: 0 };
  const initial = await deps.listNotes();
  let pending: Array<{ id: string; sec: string }> = [];

  for (const node of initial) {
    report.scanned++;
    const value = node.value;

    if (
      !node.id ||
      !value ||
      (typeof value.owner === "string" && value.owner !== deps.address) ||
      !isLegacySec(value.sec)
    ) {
      report.skipped++;
      continue;
    }

    pending.push({ id: node.id, sec: value.sec });
  }

  if (pending.length === 0) {
    return report;
  }

  let key: CryptoKey;

  try {
    key = await deriveLegacyKey(deps.privateKey);
  } catch {
    report.failed += pending.length;
    return report;
  }

  for (let pass = 0; pass < 3 && pending.length > 0; pass++) {
    const next: Array<{ id: string; sec: string }> = [];

    for (const item of pending) {
      const fresh = await deps.getNote(item.id);

      if (!fresh || !isLegacySec(fresh.value.sec)) {
        report.skipped++;
        continue;
      }

      if (fresh.value.sec !== item.sec) {
        next.push({ id: item.id, sec: fresh.value.sec });
        continue;
      }

      try {
        const plain = await decryptLegacySec(item.sec, key);
        const sec = await deps.encrypt(plain);
        const current = await deps.getNote(item.id);

        if (!current || !isLegacySec(current.value.sec) || current.value.sec !== item.sec) {
          if (!current) {
            next.push({ id: item.id, sec: item.sec });
          } else if (isLegacySec(current.value.sec)) {
            next.push({ id: item.id, sec: current.value.sec });
          } else {
            report.skipped++;
          }

          continue;
        }

        await deps.putNote(item.id, { ...current.value, sec });
        const saved = await deps.getNote(item.id);

        if (!saved) {
          next.push({ id: item.id, sec: item.sec });
        } else if (isLegacySec(saved.value.sec)) {
          next.push({ id: item.id, sec: saved.value.sec });
        } else {
          report.migrated++;
        }
      } catch {
        next.push({ id: item.id, sec: item.sec });
      }
    }

    pending = next;
  }

  report.failed += pending.length;
  return report;
}

export async function migrateNotesForCurrentUser(deps: {
  db: GDB;
  sm: SecurityManager;
  address: string;
  privateKey: string;
}): Promise<MigrationReport> {
  migrationStatus.value = "running";
  migrationFailures.value = 0;

  try {
    const report = await migrateNotes({
      address: deps.address,
      privateKey: deps.privateKey,
      listNotes: async () => (await deps.db.map(noteQuery(deps.address))).results,
      getNote: async (id) => (await deps.db.get(id)).result ?? null,
      putNote: async (id, value) => {
        if (deps.sm.getActiveEthAddress() !== deps.address) {
          throw new Error("Vault changed during migration");
        }

        return await deps.db.put(value, id);
      },
      encrypt: async (plain) => {
        if (deps.sm.getActiveEthAddress() !== deps.address) {
          throw new Error("Vault changed during migration");
        }

        return await deps.sm.encryptDataForCurrentUser(plain);
      },
    });

    migrationFailures.value = report.failed;
    migrationStatus.value = report.failed > 0 ? "failed" : "done";

    console.log(
      `[migration] migrated=${report.migrated} skipped=${report.skipped} failed=${report.failed}`,
    );

    return report;
  } catch (error) {
    migrationStatus.value = "failed";
    throw error;
  }
}
