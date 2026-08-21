import { sm } from "@/storage/db";
import { shallowReactive, toRaw } from "vue";

interface State {
  id?: string;
  type: "state";
  open_notes: string[];
  active_note: string | null;
  theme: string | null;
  drawer_open: boolean;
}

const state = shallowReactive<State>({
  id: undefined,
  type: "state",
  active_note: null,
  theme: null,
  open_notes: [],
  drawer_open: false,
});

async function bootstrap() {
  const { results } = await sm().map({
    query: {
      type: { $eq: "state" },
    },
    $limit: 1,
  });

  let result = results[0];

  if (!result) {
    const id = await sm().put({
      type: "state",
      active_note: null,
      theme: null,
      open_notes: [],
      drawer_open: false,
    } satisfies State);

    const value = await sm().get(id);

    return value.result;
  }

  return result;
}

async function startState() {
  const result = await bootstrap();

  if (!result?.value) {
    return;
  }

  state.id = result.id;
  state.active_note = result.value.active_note;
  state.open_notes = result.value.open_notes;
  state.theme = result.value.theme;
  state.drawer_open = result.value.drawer_open;
}

async function updateState({ id, ...state }: State): Promise<void> {
  await sm().put(state, id);
}

function setActiveNote(note: string | null): void {
  if (state.active_note === note) {
    return;
  }

  state.active_note = note;

  if (note && !state.open_notes.includes(note)) {
    state.open_notes = [...new Set([note, ...state.open_notes])].slice(0, 10);
  }

  updateState(toRaw(state));
}

function removeOpenNote(noteId: string): void {
  const { active_note, open_notes } = toRaw(state);

  if (!open_notes.includes(noteId)) {
    return;
  }

  const isActive = noteId === active_note;
  const remaining = open_notes.filter((it) => it !== noteId);

  state.open_notes = remaining;
  state.active_note = isActive ? (remaining[0] ?? null) : active_note;

  updateState(toRaw(state));
}

function setTheme(theme: string | null): void {
  state.theme = theme;
  updateState(toRaw(state));
}

function toggleDrawer(value?: boolean) {
  state.drawer_open = value ?? !state.drawer_open;

  updateState(toRaw(state));
}

export { state, setActiveNote, setTheme, startState, removeOpenNote, toggleDrawer };
