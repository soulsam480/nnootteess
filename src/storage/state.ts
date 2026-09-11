import { db } from "@/storage/db";
import { useStorage } from "@vueuse/core";
import { NodeObject } from "genosdb";
import { Ref, shallowReactive, toRaw } from "vue";

interface State {
  id?: string;
  owner: string;
  type: "state";
  theme: string | null;
}

const state = shallowReactive<State>({
  id: undefined,
  type: "state",
  theme: null,
  owner: "",
});

const drawerOpen = useStorage("drawer_open", false);

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
      owner: userId,
    } satisfies State);

    const value = await db().get(id);

    return value.result;
  }

  return result;
}

function setValues(node: NodeObject) {
  state.id = node.id;
  state.theme = node.value.theme;
  state.owner = node.value.owner;
  state.type = "state";
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

function toggleDrawer(value?: boolean) {
  drawerOpen.value = value ?? !drawerOpen.value;
}

export { state, setTheme, startState, toggleDrawer, drawerOpen };
