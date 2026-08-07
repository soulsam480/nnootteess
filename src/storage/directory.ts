import { sm } from "@/storage/db";
import { NodeObject } from "genosdb";
import { ref } from "vue";

export interface Directory {
  notes: {
    [note_id: string]: string;
  };
  directories: {
    [name: string]: [note_id: string];
  };
  type: "directory";
}

const DIRECTORY_ID = "__directory__";

const directory = ref<NodeObject<Directory> | null>(null);

async function bootstrap() {
  const { results } = await sm().map({
    query: {
      type: "directory",
    },
    $limit: 1,
  });

  if (results.length === 0) {
    await sm().put(
      {
        type: "directory",
        directories: {},
        notes: {},
      } satisfies Directory,
      DIRECTORY_ID,
    );
  }
}

async function startDirectory() {
  await bootstrap();

  const { unsubscribe, result } = await sm().get(DIRECTORY_ID, (node) => {
    if (!node?.value) {
      return;
    }

    directory.value = node;
  });

  if (result) {
    directory.value = result;
  }

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
