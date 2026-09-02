import { db } from "@/storage/db";
import { NodeObject } from "genosdb";
import { Ref, shallowReactive, toRaw } from "vue";

interface State {
  id?: string;
  owner: string;
  type: "state";
  theme: string | null;
  drawer_open: boolean;
  migrated_at: null | number;
}

const state = shallowReactive<State>({
  id: undefined,
  type: "state",
  theme: null,
  drawer_open: false,
  owner: "",
  migrated_at: null,
});

function makeQuery(userId: string) {
  return {
    query: {
      type: { $eq: "state" },
      owner: { $eq: userId },
    },
    $limit: 1,
  };
}

async function sync(userId: string) {
  const { results } = await db().map(makeQuery(userId));

  let result = results[0];

  if (!result) {
    const id = await db().put({
      type: "state",
      theme: null,
      drawer_open: false,
      owner: userId,
      migrated_at: null,
    } satisfies State);

    const value = await db().get(id);

    return value.result;
  }

  return result;
}

function setValues(node: NodeObject) {
  state.id = node.id;
  state.theme = node.value.theme;
  state.drawer_open = node.value.drawer_open;
  state.owner = node.value.owner;
  state.type = "state";
  state.migrated_at = node.value.migrated_at;
}

async function startState(userId: string, isLoggedIn: Ref<boolean>) {
  const result = await sync(userId);

  if (!result?.value) {
    return;
  }

  setValues(result);

  const { unsubscribe } = await db().map(makeQuery(userId), (event) => {
    if (!isLoggedIn.value || event.action === "initial") {
      return;
    }

    sync(userId).then((result) => {
      if (result) {
        setValues(result);
      }
    });
  });

  return unsubscribe;
}

async function updateState({ id, ...state }: State): Promise<void> {
  await db().put(state, id);
}

function setTheme(theme: string | null): void {
  state.theme = theme;
  updateState(toRaw(state));
}

function setMigrated(): void {
  state.migrated_at = Date.now();
  updateState(toRaw(state));
}

function toggleDrawer(value?: boolean) {
  state.drawer_open = value ?? !state.drawer_open;

  updateState(toRaw(state));
}

export { state, setTheme, startState, toggleDrawer, setMigrated };
