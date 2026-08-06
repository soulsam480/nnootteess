import { sm } from "@/storage/db";
import { NodeObject } from "genosdb";
import { ref } from "vue";

interface Directory {
  notes: {
    [note_id: string]: string;
  };
  directories: {
    [name: string]: [note_id: string];
  };
  type: "directory";
}

let directoryId: string | null;

const directory = ref<NodeObject<Directory> | null>(null);

async function bootstrap() {
  if (directoryId) {
    return directoryId;
  }

  const { results } = await sm().map({
    query: {
      type: "directory",
    },
    $limit: 1,
  });

  if (results.length === 0) {
    directoryId = await sm().put({
      type: "directory",
      directories: {},
      notes: {},
    } satisfies Directory);
  } else {
    directoryId = results[0].id;
  }

  return directoryId;
}

async function startDirectory() {
  const id = await bootstrap();

  const { unsubscribe } = await sm().get(id, (node) => {
    directory.value = node;
  });

  return unsubscribe;
}

async function sync(note: { id: string; value: { name: string } }, state: "add" | "remove") {
  if (!directory.value) {
    return;
  }

  const notes = { ...directory.value.value.notes };

  if (state === "add") {
    notes[note.id] = note.value.name;
  } else {
    delete notes[note.id];
  }

  return await sm().put(
    {
      ...directory.value.value,
      notes,
    } satisfies Directory,
    directory.value.id,
  );
}

export { directory, startDirectory, sync };
