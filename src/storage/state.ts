import { sm } from "@/storage/db";
import { reactive, toRaw } from "vue";

interface State {
  type: "state";
  open_notes: string[];
  active_note: string | null;
  theme: string | null;
}

const state = reactive<State>({
  type: "state",
  active_note: null,
  theme: null,
  open_notes: [],
});

const STATE_ID = "__state__";

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

  const { unsubscribe, result } = await sm().get(STATE_ID, (node) => {
    if (!node) {
      return;
    }

    state.active_note = node.value.active_note;
    state.open_notes = node.value.open_notes;
    state.theme = node.value.theme;
  });

  if (result?.value) {
    state.active_note = result.value.active_note;
    state.open_notes = result.value.open_notes;
    state.theme = result.value.theme;
  }

  return unsubscribe;
}

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

export { state, setActiveNote, setTheme, startState };
