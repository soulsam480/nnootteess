import { decryptLegacySec, deriveLegacyKey, isLegacySec } from "@/storage/legacy-crypto";
import { noteQuery } from "@/storage/note-query";

export { noteQuery };

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
