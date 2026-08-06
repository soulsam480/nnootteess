import { sm } from "@/storage/db";
import { NodeObject } from "genosdb";

export interface Note {
  type: "note";
  name: string;
  content: string;
  created_at: number;
  updated_at: number;
  meta: Record<string, string>;
}

const queryKeys = {
  all() {
    return "notes";
  },
  find(id: string) {
    return `notes/${id}`;
  },
};

async function all(): Promise<NodeObject<Omit<Note, "content"> & { content?: string }>[]> {
  const { results } = await sm().map({
    query: {
      type: "note",
    },
  });

  return results.map((it: NodeObject<Note>) => {
    const { content: _, ...rest } = it.value;

    return { ...it, value: rest };
  });
}

async function create(name: string): Promise<NodeObject<Note>> {
  const noteId = await sm().put({
    meta: {},
    name,
    content: "",
    created_at: Date.now(),
    type: "note",
    updated_at: Date.now(),
  } satisfies Note);

  return await find(noteId);
}

async function update(id: string, note: Note): Promise<NodeObject<Note>> {
  await sm().put(note, id);

  return await find(id);
}

async function find(id: string): Promise<NodeObject<Note>> {
  const { result } = await sm().get(id);

  if (!result) {
    throw new Error("note not found");
  }

  return result;
}

async function delete_(id: string): Promise<void> {
  return await sm().remove(id);
}

export { all, create, find, update, delete_ as delete, queryKeys };
