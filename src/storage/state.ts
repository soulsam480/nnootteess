import { sm } from "@/storage/db";
import { reactive, toRaw } from "vue";

interface State {
  open_notes: string[];
  active_note: string | null;
  theme: string | null;
}

const state = reactive<State>({
  active_note: null,
  theme: null,
  open_notes: [],
});

const STATE_ID = "__state__";

async function updateState(state: State): Promise<void> {
  await sm().put(state, STATE_ID);
}

function setActiveNote(note: string | null): void {
  state.active_note = note;

  updateState(toRaw(state));
}

function setTheme(theme: string | null): void {
  state.theme = theme;
  updateState(toRaw(state));
}

export { state, setActiveNote, setTheme };
