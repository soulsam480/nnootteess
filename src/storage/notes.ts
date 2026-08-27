import { db, sm } from "@/storage/db";
import { NodeObject } from "genosdb";
import { camelCase, kebabCase } from "scule";
import { onBeforeUnmount, Ref, ref } from "vue";

interface CommonNote {
  name: string;
  content: string;
  created_at: number;
  updated_at: number;
  meta: Record<string, string>;
}

interface TextNote extends CommonNote {
  type: "note";
}

export interface CodeNote extends CommonNote {
  type: "code";
  language: Language;
}

export type Note = TextNote | CodeNote;

export type TListNote = Omit<Note, "content"> & { content?: string };

const LANGUAGES = ["json", "javascript", "typescript"] as const;

export type Language = (typeof LANGUAGES)[number];

export interface INotesState {
  notes: NodeObject<TListNote>[];
  index: Map<string, NodeObject<TListNote>>;
}

const LANGUAGE_TO_EXT = {
  json: "json",
  javascript: "js",
  typescript: "ts",
  css: "css",
  html: "html",
  markdown: "md",
};

const notes = ref<INotesState>({
  index: new Map(),
  notes: [],
});

const noteToBeDeleted = ref<NodeObject<TListNote> | null>(null);

async function startNotes(isLoggedIn: Ref<boolean>) {
  async function sync() {
    if (!isLoggedIn.value) {
      return;
    }

    const state = await all();

    notes.value = {
      index: state.reduce((acc, curr) => {
        acc.set(curr.id, curr);

        return acc;
      }, new Map<string, NodeObject<TListNote>>()),
      notes: state,
    };
  }

  await sync();

  db().map({}, ({ action }) => {
    if (action !== "initial") {
      sync();
    }
  });

  return notes;
}

async function useNote(id: string, onRemove: (id: string) => void) {
  const note = ref<NodeObject<Note>>();

  let unsub: (() => void) | undefined;

  onBeforeUnmount(() => {
    unsub?.();
  });

  const { unsubscribe, result } = await sm().get(id, (node) => {
    if (!node?.value) {
      onRemove(id);
      return;
    }

    note.value = node;
  });

  if (result?.value) {
    note.value = result;
  } else {
    onRemove(id);
  }

  unsub = unsubscribe;

  return note;
}

async function all(): Promise<NodeObject<Omit<Note, "content"> & { content?: string }>[]> {
  const { results } = await sm().map({
    query: {
      type: { $in: ["note", "code"] },
    },
    field: "created_at",
    order: "desc",
  });

  return results.map((it: NodeObject<Note>) => {
    const { content: _, ...rest } = it.value;

    return { ...it, value: rest };
  });
}

async function createCode(name: string, language: Language): Promise<NodeObject<Note>> {
  const noteId = await sm().put({
    meta: {},
    name,
    content: "",
    created_at: Date.now(),
    type: "code",
    language,
    updated_at: Date.now(),
  } satisfies Note);

  return await find(noteId);
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

function noteToFileName(note: CodeNote): string {
  return `${camelCase(kebabCase(note.name.replaceAll(/\s+/g, "-")))}.${LANGUAGE_TO_EXT[note.language]}`;
}

export {
  create,
  update,
  delete_ as delete,
  createCode,
  useNote,
  LANGUAGES,
  notes,
  startNotes,
  LANGUAGE_TO_EXT,
  noteToFileName,
  noteToBeDeleted,
};
