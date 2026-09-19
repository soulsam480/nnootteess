import { PRIORITY } from "@/components/commands/state";
import { CommandConfig } from "@/components/commands/types";
import { db, sm } from "@/storage/db";
import { openNote } from "@/storage/tabGroups";
import { user } from "@/storage/user";
import { NodeObject, QueryOptions } from "genosdb";
import { kebabCase } from "scule";
import { onBeforeUnmount, Ref, ref, shallowRef, watch } from "vue";
import CarbonSearch from "~icons/carbon/search";

import CarbonDocument from "~icons/carbon/document";
import CarbonCode from "~icons/carbon/code";

const CURRENT_VERSION = 1;

interface CommonNote {
  name: string;
  content: string;
  created_at: number;
  updated_at: number;
  meta: Record<string, string>;
  owner: string;
  pinned: boolean | undefined;
  sec: {
    content: string;
  };
  version: number;
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

const LANGUAGES = [
  "json",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "css",
  "html",
  "markdown",
] as const;

export type Language = (typeof LANGUAGES)[number];

export interface INotesState {
  notes: NodeObject<TListNote>[];
  index: Map<string, NodeObject<TListNote>>;
}

const LANGUAGE_TO_EXT: Record<Language, string> = {
  json: "json",
  javascript: "js",
  typescript: "ts",
  css: "css",
  html: "html",
  markdown: "md",
  jsx: "jsx",
  tsx: "tsx",
};

const notes = shallowRef<INotesState>({
  index: new Map(),
  notes: [],
});

export const lastFocusedNote = ref<string | null>(null);

watch(
  lastFocusedNote,
  (noteId) => {
    let title = document.head.querySelector("title");

    if (!title) {
      title = document.createElement("title");

      document.head.appendChild(title);
    }

    if (!noteId) {
      title.innerText = "NOTESx2";
      return;
    }

    const note = notes.value.index.get(noteId);

    title.innerText = note?.value.name ?? "NOTESx2";
  },
  { immediate: true },
);

export function makeNoteCommands(notes: NodeObject<TListNote>[]): CommandConfig[] {
  return [
    {
      id: "sesrch-notes",
      name: "Search...",
      actions: {
        default: {
          shortcut: "$mod+f",
        },
      },
      priority: PRIORITY.regular,
      icon: CarbonSearch,
      placeholder: "Search notes...",
    },
    ...notes.map(
      (note) =>
        ({
          id: note.id,
          name: note.value.name,
          parent: "sesrch-notes",
          actions: {
            default: {
              perform: async (command) => {
                openNote(command.id);
              },
            },
          },
          icon: note.value.type === "note" ? CarbonDocument : CarbonCode,
        }) satisfies CommandConfig,
    ),
  ];
}

const noteToBeDeleted = ref<NodeObject<TListNote> | null>(null);

function makeQuery(userId: string) {
  return {
    query: {
      type: { $in: ["note", "code"] },
      owner: userId,
    },
    field: "created_at",
    order: "desc",
  } satisfies QueryOptions;
}

async function unwrapNote(note: NodeObject): Promise<NodeObject<Note>> {
  const {
    value: { sec, ...restValue },
    ...rest
  } = note;

  const unwrapped = await sm().decryptDataForCurrentUser(sec);

  return {
    ...rest,
    value: {
      ...restValue,
      version: restValue.version ?? 1,
      sec: unwrapped,
      content: unwrapped.content,
    },
  };
}

async function wrapNote(note: Note): Promise<NodeObject["value"]> {
  const { sec, content: _, ...restValue } = note;

  return {
    ...restValue,
    // NOTE: for existing, if it's nothing, it's v1
    version: restValue.version ?? 1,
    sec: await sm().encryptDataForCurrentUser(sec),
  };
}

async function startNotes(userId: string, isLoggedIn: Ref<boolean>) {
  async function sync() {
    if (!isLoggedIn.value) {
      return;
    }

    const state = await all(userId);

    notes.value = {
      index: state.reduce((acc, curr) => {
        acc.set(curr.id, curr);

        return acc;
      }, new Map<string, NodeObject<TListNote>>()),
      notes: state,
    };
  }

  db().map(makeQuery(userId), sync);
}

async function useNote(id: string, onRemove: (id: string) => void) {
  const note = shallowRef<NodeObject<Note>>();

  let unsub: (() => void) | undefined;

  onBeforeUnmount(() => {
    unsub?.();
  });

  const { unsubscribe, result } = await db().get(id, (node) => {
    if (!node?.value) {
      onRemove(id);
      return;
    }

    unwrapNote(node).then((node) => {
      note.value = node;
    });
  });

  if (result?.value) {
    note.value = await unwrapNote(result);
  } else {
    onRemove(id);
  }

  unsub = unsubscribe;

  return note;
}

async function all(
  userId: string,
): Promise<NodeObject<Omit<Note, "content"> & { content?: string }>[]> {
  const { results } = await db().map(makeQuery(userId));

  return results.map((it) => {
    // NOTE: avoid loading massive data into memory for all notes
    const { sec: _, ...rest } = it.value;

    return { ...it, value: { ...rest, sec: {} } };
  });
}

async function createCode(name: string, language: Language): Promise<NodeObject<Note>> {
  const userId = user.id;

  if (!userId) {
    throw new Error("user not logged in");
  }

  const noteId = await db().put(
    await wrapNote({
      meta: {},
      name,
      created_at: Date.now(),
      type: "code",
      language,
      owner: userId,
      updated_at: Date.now(),
      sec: { content: "" },
      content: "",
      pinned: false,
      version: CURRENT_VERSION,
    } satisfies Note),
  );

  return await find(noteId);
}

async function create(name: string): Promise<NodeObject<Note>> {
  const userId = user.id;

  if (!userId) {
    throw new Error("user not logged in");
  }

  const noteId = await db().put(
    await wrapNote({
      meta: {},
      name,
      owner: userId,
      created_at: Date.now(),
      type: "note",
      updated_at: Date.now(),
      pinned: false,
      sec: {
        content: "",
      },
      content: "",
      version: CURRENT_VERSION,
    } satisfies Note),
  );

  return await find(noteId);
}

async function update(id: string, note: Note): Promise<NodeObject<Note>> {
  if (!("content" in note.sec)) {
    throw new Error("content not found in sec");
  }

  await db().put(
    await wrapNote({
      ...note,
      updated_at: Date.now(),
    }),
    id,
  );

  return await find(id);
}

async function find(id: string): Promise<NodeObject<Note>> {
  const { result } = await db().get(id);

  if (!result) {
    throw new Error("note not found");
  }

  return await unwrapNote(result);
}

async function delete_(id: string): Promise<void> {
  return await db().remove(id);
}

function normalizeName(name: string): string {
  return kebabCase(name.replaceAll(/(\s|\?|\!)+/g, "-"));
}

function noteToFileName(note: CodeNote): string {
  return `${normalizeName(note.name)}.${LANGUAGE_TO_EXT[note.language]}`;
}

async function exportNotes() {
  const userId = user.id;

  if (!userId) {
    throw new Error("user not logged in");
  }

  const { Zip } = await import("@greggman/zipup");

  const { results } = await db().map(makeQuery(userId));

  const zip = new Zip();

  for (const node of await Promise.all(results.map(unwrapNote))) {
    const { value: note } = node;

    zip.addFile(
      {
        name: note.type == "code" ? noteToFileName(note) : `${normalizeName(note.name)}.md`,
      },
      note.content,
    );
  }

  const blob = await zip.finalize();

  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";

  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = `nnotesx2-export-${new Date().toDateString()}.zip`;
  a.click();
}

async function importNotes(files: FileList) {
  //@ts-expect-error old dom types
  for (const file of files) {
    // TODO: do
  }
}

export {
  all as allNotes,
  create,
  update,
  find,
  delete_ as delete,
  createCode,
  useNote,
  LANGUAGES,
  notes,
  startNotes,
  LANGUAGE_TO_EXT,
  noteToFileName,
  noteToBeDeleted,
  exportNotes,
  importNotes,
  wrapNote,
  unwrapNote,
};
