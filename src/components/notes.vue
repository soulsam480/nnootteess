<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import { toggleDrawer } from "@/storage/state";
import { computed, onMounted } from "vue";
import CarbonTrashCan from "~icons/carbon/trash-can";
import CarbonDocument from "~icons/carbon/document";
import CarbonCode from "~icons/carbon/code";
import CarbonSplitScreen from "~icons/carbon/split-screen";
import { formatDate } from "@/utils/date";
import { onLongPress, useMediaQuery } from "@vueuse/core";
import { NodeObject } from "genosdb";
import { LANG_TO_COLOR } from "@/utils/codemirror";
import { activeNoteIds, openNote } from "@/storage/tabGroups";
import CarbonPin from "~icons/carbon/pin";

const hasNotes = computed(() => {
  return noteAPI.notes.value.notes.length > 0;
});

const isSmallScreen = useMediaQuery("(max-width: 600px)");

function noteIdFromEvent(event: MouseEvent) {
  const parent = (event.currentTarget as HTMLButtonElement).closest<
    HTMLDivElement
  >("[popover]");

  const noteId = parent?.getAttribute("data-note");

  return noteId;
}

function handleToggle(event: ToggleEvent) {
  if (event.newState === "closed") {
    (event.target as HTMLElement).removeAttribute("data-note");
  }
}

function openPopover(source: HTMLElement, id: string) {
  const pop = document.querySelector<HTMLElement>("#note-actions");

  pop?.setAttribute("data-note", id);

  // @ts-expect-error types are wrong
  pop?.showPopover({ source });
}

function closePopover() {
  const pop = document.querySelector<HTMLElement>("#note-actions");

  pop?.hidePopover();
}

async function deleteNote(
  event: MouseEvent,
) {
  closePopover();
  event.stopPropagation();

  const noteId = noteIdFromEvent(event);

  if (!noteId) {
    return;
  }

  const note = noteAPI.notes.value.index.get(noteId);

  if (!note) {
    return;
  }

  noteAPI.noteToBeDeleted.value = note;
}

async function togglePinNote(
  event: MouseEvent,
) {
  closePopover();
  event.stopPropagation();

  const noteId = noteIdFromEvent(event);

  if (!noteId) {
    return;
  }

  const note = noteAPI.notes.value.index.get(noteId);

  if (!note) {
    return;
  }

  await noteAPI.update(
    note.id,
    { ...note.value, pinned: !Boolean(note.value.pinned) } as noteAPI.Note,
  );
}

function handleClick(
  event: MouseEvent,
  note: NodeObject<noteAPI.TListNote> | undefined,
  split?: boolean,
) {
  closePopover();
  event.stopPropagation();

  const noteId = note?.id ?? noteIdFromEvent(event);

  if (!noteId) {
    return;
  }

  split = split ?? (event.ctrlKey || event.metaKey);

  openNote(
    noteId,
    split,
  );

  if (isSmallScreen.value) {
    toggleDrawer(false);
  }
}

// ------------- note actions handlers -----------------

onMounted(() => {
  document.addEventListener("pointerdown", (event) => {
    const pop = document.querySelector<HTMLElement>("#note-actions");

    if (!pop?.matches(":popover-open")) return;

    const target = event.target as Node;

    if (!pop.contains(target)) {
      pop.hidePopover();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const pop = document.querySelector<HTMLElement>("#note-actions");

    if (pop?.matches(":popover-open")) {
      pop.hidePopover();
    }
  });
});

function handleOpenActions(
  event: MouseEvent,
  note: NodeObject<noteAPI.TListNote>,
) {
  event.preventDefault();
  event.stopPropagation();

  const source = event.currentTarget as HTMLElement;

  openPopover(source, note.id);
}

onLongPress(document.body, (event) => {
  if (
    !(event.target instanceof HTMLElement &&
      event.target.matches("li.link *"))
  ) {
    return;
  }

  const noteId = event.target.closest<HTMLElement>("li.link")?.id.replace(
    "note-",
    "",
  );

  if (noteId) {
    openPopover(event.target, noteId);
  }
}, { modifiers: { prevent: true }, delay: 500 });
</script>

<template>
  <div
    id="note-actions"
    class="mdst-popover mdst-popover--anchored mdst-popover--sm note-actions"
    popover="manual"
    @toggle="handleToggle"
  >
    <p class="mdst-p--muted note-actions__header">
      ACTIONS
    </p>

    <button
      @click="togglePinNote($event)"
      class="mdst-button mdst-button--sm mdst-button--ghost"
      title="Pin"
      type="button"
    >
      <CarbonPin />
      Pin/Un-pin
    </button>

    <button
      @click="handleClick($event, undefined, true)"
      title="Split"
      type="button"
      class="mdst-button mdst-button--sm mdst-button--ghost"
    >
      <CarbonSplitScreen />
      Split
    </button>

    <button
      @click="deleteNote($event)"
      class="mdst-button note-actions__delete mdst-button--sm mdst-button--ghost"
      title="Delete"
      popovertarget="delete-note-confirmation"
      type="button"
    >
      <CarbonTrashCan />
      Delete
    </button>
  </div>

  <ul class="notes">
    <li
      v-for="note in noteAPI.notes.value.notes"
      class="link"
      :class="{ active: activeNoteIds.some((it) => it[1] === note.id) }"
      @click="handleClick($event, note)"
      :title="formatDate(note.value.created_at)"
      @contextmenu="handleOpenActions($event, note)"
      :id="`note-${note.id}`"
    >
      <span
        class="link__icon"
        :style="{
          color: LANG_TO_COLOR[(note.value as noteAPI.CodeNote).language] ??
            LANG_TO_COLOR.md,
        }"
      >
        <CarbonDocument v-if='note.value.type === "note"' />
        <CarbonCode
          v-else-if='note.value.type === "code"'
        />
      </span>
      <span class="mdst-truncate">
        {{ note.value.name }}
      </span>
      <span class="link__marks" v-if="note.value.pinned">
        <CarbonPin />
      </span>
    </li>
    <p v-if="!hasNotes" class="mdst-p--muted">
      No notes yet
    </p>
  </ul>
</template>
