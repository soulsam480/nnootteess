import { sm } from "@/storage/db";
import { shallowReactive, toRaw } from "vue";

interface State {
  type: "state";
  open_notes: string[];
  active_note: string | null;
  theme: string | null;
}

const state = shallowReactive<State>({
  type: "state",
  active_note: null,
  theme: null,
  open_notes: [],
});

const STATE_ID = "__state__";

async function bootstrap() {
  const { result } = await sm().get(STATE_ID);

  if (!result) {
    await sm().put(
      {
        type: "state",
        active_note: null,
        theme: null,
        open_notes: [],
      } satisfies State,
      STATE_ID,
    );
  }
}

async function startState() {
  await bootstrap();

  const { result } = await sm().get(STATE_ID);

  if (result?.value) {
    state.active_note = result.value.active_note;
    state.open_notes = result.value.open_notes;
    state.theme = result.value.theme;
  }
}

async function updateState(state: State): Promise<void> {
  await sm().put(state, STATE_ID);
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

export { state, setActiveNote, setTheme, startState, removeOpenNote };
