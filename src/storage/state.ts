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
  state.theme = result.value.theme;
  state.drawer_open = result.value.drawer_open;
}

async function updateState({ id, ...state }: State): Promise<void> {
  await sm().put(state, id);
}

function setTheme(theme: string | null): void {
  state.theme = theme;
  updateState(toRaw(state));
}

function toggleDrawer(value?: boolean) {
  state.drawer_open = value ?? !state.drawer_open;

  updateState(toRaw(state));
}

export { state, setTheme, startState, toggleDrawer };
