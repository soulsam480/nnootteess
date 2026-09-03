import { clearLegacyOPFSEntry, db, IDatabaseAPI } from "@/storage/db";
import { Note, wrapNote } from "@/storage/notes";
import { setMigrated } from "@/storage/state";
import { ref } from "vue";

export type MigrationState = "idle" | "notes" | "state" | "tabs" | "done" | "failed";

export const migrationStatus = ref<MigrationState>("idle");

async function migrateState(legacyDb: IDatabaseAPI, userId: string) {
  const { results } = await legacyDb.sm().map({
    query: {
      type: { $eq: "state" },
    },
    $limit: 1,
  });

  if (results.length === 0) {
    return;
  }

  return await db().put({ ...results[0].value, owner: userId });
}

async function migrateNotes(legacyDb: IDatabaseAPI, userId: string) {
  const identityMap = new Map<string, string>();

  const { results } = await legacyDb.sm().map({
    query: {
      type: { $in: ["note", "code"] },
    },
    field: "created_at",
    order: "desc",
  });

  if (results.length === 0) {
    return identityMap;
  }

  for (const note of results) {
    const { content, ...value } = note.value as Note;

    const id = await db().put(
      await wrapNote({
        ...value,
        owner: userId,
        content,
        sec: { content },
      }),
    );

    identityMap.set(note.id, id);
  }

  return identityMap;
}

async function migrateTabs(
  legacyDb: IDatabaseAPI,
  userId: string,
  notesIdentity: Map<string, string>,
) {
  const { results } = await legacyDb.sm().map({
    query: {
      type: "tab_group",
    },
    field: "created_at",
    order: "desc",
  });

  if (results.length === 0) {
    return;
  }

  const moved: string[] = [];

  for (const tab of results) {
    const id = await db().put({
      ...tab.value,
      owner: userId,
    });

    moved.push(id);

    for (const note of tab.edges) {
      const resolved = notesIdentity.get(note);

      if (resolved) {
        await db().link(id, resolved);
      }
    }
  }

  return moved;
}

export async function migrate(legacyDb: IDatabaseAPI, userId: string) {
  try {
    migrationStatus.value = "state";
    const stateId = await migrateState(legacyDb, userId);

    migrationStatus.value = "notes";
    const notes = await migrateNotes(legacyDb, userId);

    migrationStatus.value = "tabs";
    const movedTabs = await migrateTabs(legacyDb, userId, notes);

    migrationStatus.value = "done";

    const results: boolean[] = [];

    if (stateId) {
      const { result } = await db().get(stateId);
      results.push(result !== null);
    }

    if (notes.size > 0) {
      results.push(true);
    }

    if (movedTabs && movedTabs.length > 0) {
      results.push(true);
    }

    if (results.every((it) => it)) {
      await legacyDb.db().clear();
      await legacyDb.sm().clearSecurity();
      setMigrated();
      clearLegacyOPFSEntry();
    }

    return "done";
  } catch (error) {
    console.log("[Failed during migration]: ", error);
    migrationStatus.value = "failed";

    return "failed";
  }
}
