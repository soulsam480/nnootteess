import { db, sm } from "@/storage/db";
import { NodeObject } from "genosdb";
import { computed, Ref, shallowRef, watch } from "vue";

export interface ITabGroup {
  active: string;
  created_at: number;
  type: "tab_group";
}

const tabGroups = shallowRef<Array<NodeObject<ITabGroup>>>([]);

const activeNoteIds = computed(() =>
  tabGroups.value.reduce<[string, string][]>((acc, curr) => {
    if (curr.value.active) {
      acc.push([curr.id, curr.value.active]);
    }

    return acc;
  }, []),
);

watch(activeNoteIds, (value) => {
  if (value.length === 0) {
    const title = document.head.querySelector("title");

    if (title) {
      title.innerText = "NNOOTTEESS";
    }
  }
});

async function all() {
  const { results } = await sm().map({
    query: {
      type: "tab_group",
    },
    field: "created_at",
    order: "desc",
  });

  return results;
}

async function startTabGroups(isLoggedIn: Ref<boolean>) {
  async function sync() {
    if (!isLoggedIn.value) {
      return;
    }

    const state = await all();

    tabGroups.value = state;
  }

  await sync();

  db().map({}, ({ action }) => {
    if (action !== "initial") {
      sync();
    }
  });

  return tabGroups;
}

async function openNote(noteId: string, split = false) {
  // 1. first check if it's open or not
  // 2. if open, set active
  // 3. else find last group and link + set active
  // 4. else create new group and link + set active

  if (!split) {
    const containingTab = tabGroups.value.find((it) => it.edges.includes(noteId));

    if (containingTab && containingTab.value.active !== noteId) {
      await sm().put(
        {
          ...containingTab.value,
          active: noteId,
        } satisfies ITabGroup,
        containingTab.id,
      );
      return;
    }
  }

  const last = tabGroups.value.at(-1);

  if (!last || split) {
    const groupId = await sm().put({
      active: noteId,
      created_at: Date.now(),
      type: "tab_group",
    } satisfies ITabGroup);

    await db().link(groupId, noteId);
  } else {
    await db().link(last.id, noteId);

    await sm().put(
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

  console.log({ groups });

  if (groups.length === 0) {
    return;
  }

  for (const tabGroup of groups) {
    const another = tabGroup?.edges.find((it) => it !== noteId);
    const isActive = tabGroup?.value.active === noteId;

    // NOTE: if the current one is active in the tab and there's
    // another note to set as active, do that
    if (isActive && another) {
      await sm().put(
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
        await sm().remove(tabGroup.id);
      }
    }
  }
}

export { tabGroups, startTabGroups, openNote, closeNote, activeNoteIds };
