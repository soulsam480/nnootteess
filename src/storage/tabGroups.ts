import { db } from "@/storage/db";
import { lastFocusedNote } from "@/storage/notes";
import { user } from "@/storage/user";
import { NodeObject, QueryOptions } from "genosdb";
import { computed, ref, Ref, shallowRef, watch } from "vue";

const CURRENT_VERSION = 1;

export interface ITabGroup {
  owner: string;
  active: string;
  created_at: number;
  type: "tab_group";
  version: number;
}

const tabGroups = shallowRef<Array<NodeObject<ITabGroup>>>([]);

const lastFocusedTab = ref<string | null>(null);

const activeNoteIds = computed(() =>
  tabGroups.value.reduce<[string, string][]>((acc, tab) => {
    if (tab.value.active) {
      acc.push([tab.id, tab.value.active]);
    }

    return acc;
  }, []),
);

watch(activeNoteIds, (value) => {
  if (value.length === 0) {
    lastFocusedNote.value = null;
  } else if (lastFocusedNote.value === null) {
    lastFocusedNote.value = value[0][1];
  }
});

function makeQuery(userId: string) {
  return {
    query: {
      type: "tab_group",
      owner: { $eq: userId },
    },
    field: "created_at",
    order: "desc",
  } satisfies QueryOptions;
}

async function all(userId: string) {
  const { results } = await db().map(makeQuery(userId));

  return results;
}

async function startTabGroups(userId: string, isLoggedIn: Ref<boolean>) {
  async function sync() {
    if (!isLoggedIn.value) {
      return;
    }

    const state = await all(userId);

    tabGroups.value = state.map((it) => ({
      ...it,
      value: { ...it.value, version: it.value.version ?? CURRENT_VERSION },
    }));
  }

  await sync();

  db().map(makeQuery(userId), ({ action }) => {
    if (action !== "initial") {
      sync();
    }
  });

  return tabGroups;
}

async function openNote(noteId: string, split = false) {
  const userId = user.id;

  if (!userId) {
    return;
  }

  lastFocusedNote.value = noteId;

  // 1. first check if it's open or not
  // 2. if open, set active
  // 3. else find last group and link + set active
  // 4. else create new group and link + set active

  if (!split) {
    const containingTab = tabGroups.value.find((it) => it.edges.includes(noteId));

    if (containingTab && containingTab.value.active !== noteId) {
      await db().put(
        {
          ...containingTab.value,
          active: noteId,
        } satisfies ITabGroup,
        containingTab.id,
      );
      return;
    }
  }

  const last = lastFocusedTab.value
    ? tabGroups.value.find((it) => it.id === lastFocusedTab.value)
    : tabGroups.value.at(-1);

  if (!last || split) {
    const groupId = await db().put({
      active: noteId,
      created_at: Date.now(),
      type: "tab_group",
      owner: userId,
      version: CURRENT_VERSION,
    } satisfies ITabGroup);

    await db().link(groupId, noteId);
  } else {
    await db().link(last.id, noteId);

    await db().put(
      {
        ...last.value,
        active: noteId,
      } satisfies ITabGroup,
      last.id,
    );
  }
}

async function closeNote(noteId: string, groupId?: string) {
  const groups = tabGroups.value.filter((it) =>
    groupId !== undefined ? it.id === groupId : it.edges.includes(noteId),
  );

  if (groups.length === 0) {
    return;
  }

  for (const tabGroup of groups) {
    const another = tabGroup?.edges.find((it) => it !== noteId);
    const isActive = tabGroup?.value.active === noteId;

    // NOTE: if the current one is active in the tab and there's
    // another note to set as active, do that
    if (isActive && another) {
      await db().put(
        {
          ...tabGroup.value,
          active: another,
        } satisfies ITabGroup,
        tabGroup.id,
      );

      await db().unlink(tabGroup.id, noteId);
      // NOTE: if there's not another one
      // just remove the group
    } else {
      await db().unlink(tabGroup.id, noteId);

      if (!another) {
        await db().remove(tabGroup.id);
        if (lastFocusedTab.value === tabGroup.id) {
          lastFocusedTab.value = null;
        }
      }
    }
  }
}

export { tabGroups, startTabGroups, openNote, closeNote, activeNoteIds, lastFocusedTab };
