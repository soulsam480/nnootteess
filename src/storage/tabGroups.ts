import { indexedDb, ITabGroup } from "@/storage/indexeddb";
import { lastFocusedNote } from "@/storage/notes";
import { user } from "@/storage/user";
import { computed, ref, Ref, shallowRef, watch } from "vue";

const tabGroups = shallowRef<Array<ITabGroup>>([]);

const lastFocusedTab = ref<number | null>(null);

const activeNoteIds = computed(() =>
  tabGroups.value.reduce<[number, string][]>((acc, tab) => {
    if (tab.active && tab.id !== undefined) {
      acc.push([tab.id, tab.active]);
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

async function all(userId: string) {
  const data = await indexedDb
    .transaction("tab_groups")
    .store.index("tab_group_on_owner")
    .getAll(userId);

  return data;
}

async function sync(userId = user.id) {
  if (!userId) {
    return;
  }

  const groups = await all(userId);

  try {
    tabGroups.value = groups;
  } catch {
    window.setTimeout(() => {
      tabGroups.value = groups;
    }, 1000);
  }
}

async function startTabGroups(userId: string, isLoggedIn: Ref<boolean>) {
  if (!isLoggedIn.value) {
    return;
  }

  await sync(userId);
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
    const containingTab = tabGroups.value.find((it) => it.notes.includes(noteId));

    if (containingTab && containingTab.active !== noteId) {
      await indexedDb.put("tab_groups", {
        ...containingTab,
        active: noteId,
      } satisfies ITabGroup);

      await sync();
      return;
    }
  }

  const last = lastFocusedTab.value
    ? tabGroups.value.find((it) => it.id === lastFocusedTab.value)
    : tabGroups.value.at(-1);

  if (!last || split) {
    await indexedDb.put("tab_groups", {
      active: noteId,
      created_at: Date.now(),
      owner: userId,
      notes: [noteId],
    } satisfies ITabGroup);
  } else {
    await indexedDb.put("tab_groups", {
      ...last,
      notes: [...new Set([...last.notes, noteId])],
      active: noteId,
    } satisfies ITabGroup);
  }

  await sync();
}

async function closeNote(noteId: string, groupId?: number) {
  const groups = tabGroups.value.filter((it) =>
    groupId !== undefined ? it.id === groupId : it.notes.includes(noteId),
  );

  if (groups.length === 0) {
    return;
  }

  for (const tabGroup of groups) {
    const another = tabGroup?.notes.find((it) => it !== noteId);
    const isActive = tabGroup?.active === noteId;

    // NOTE: if the current one is active in the tab and there's
    // another note to set as active, do that
    if (another) {
      await indexedDb.put("tab_groups", {
        ...tabGroup,
        active: isActive ? another : tabGroup.active,
        notes: tabGroup.notes.filter((it) => it !== noteId),
      } satisfies ITabGroup);

      // NOTE: if there's not another one
      // just remove the group
    } else {
      if (tabGroup.id !== undefined) {
        await indexedDb.delete("tab_groups", tabGroup.id);
        if (lastFocusedTab.value === tabGroup.id) {
          lastFocusedTab.value = null;
        }
      }
    }
  }

  await sync();
}

export { tabGroups, startTabGroups, openNote, closeNote, activeNoteIds, lastFocusedTab };
