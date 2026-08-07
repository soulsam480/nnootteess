import { sm } from "@/storage/db";
import { NodeObject } from "genosdb";
import { camelCase, kebabCase } from "scule";

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

interface CodeNote extends CommonNote {
  type: "code";
  language: Language;
}

export type Note = TextNote | CodeNote;

const LANGUAGES = ["json"] as const;

export type Language = (typeof LANGUAGES)[number];

const LANGUAGE_TO_EXT = {
  json: "json",
  javascript: "js",
  typescript: "ts",
  css: "css",
  html: "html",
  markdown: "md",
};

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
  all,
  create,
  find,
  update,
  delete_ as delete,
  queryKeys,
  createCode,
  LANGUAGES,
  LANGUAGE_TO_EXT,
  noteToFileName,
};
