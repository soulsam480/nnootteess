<script module lang="ts">
export type NoteOrder = "asc" | "desc";

export const notesOrder = useStorage<NoteOrder>("notes_order", "desc");
</script>
<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import { toggleDrawer } from "@/storage/state";
import { computed, useTemplateRef } from "vue";
import CarbonDocument from "~icons/carbon/document";
import CarbonCode from "~icons/carbon/code";
import { formatDate } from "@/utils/date";
import { onLongPress, useMediaQuery, useStorage } from "@vueuse/core";
import { NodeObject } from "genosdb";
import { LANG_TO_COLOR } from "@/utils/codemirror";
import { activeNoteIds, openNote } from "@/storage/tabGroups";
import CarbonPin from "~icons/carbon/pin";
import NoteActions from "./note-actions.vue";

const hasNotes = computed(() => {
  return noteAPI.notes.value.notes.length > 0;
});

const isSmallScreen = useMediaQuery("(max-width: 600px)");

const notesList = useTemplateRef("notesList");

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

  const note = await noteAPI.find(noteId);

  if (!note) {
    return;
  }

  const { value } = note;

  await noteAPI.update(
    note.id,
    { ...value, pinned: !Boolean(value.pinned) } as noteAPI.Note,
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

function handleOpenActions(
  event: MouseEvent,
  note: NodeObject<noteAPI.TListNote>,
) {
  event.preventDefault();
  event.stopPropagation();

  const source = event.currentTarget as HTMLElement;

  openPopover(source, note.id);
}

onLongPress(notesList, (event) => {
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

const notesToShow = computed(() => {
  return noteAPI.notes.value.notes.toSorted((a, b) => {
    if (a.value.pinned !== b.value.pinned) {
      return a.value.pinned ? -1 : 1;
    }

    if (notesOrder.value === "asc") {
      return a.value.created_at - b.value.created_at;
    }

    return b.value.created_at - a.value.created_at;
  });
});
</script>

<template>
  <NoteActions
    @toggle="handleToggle"
    @togglePin="togglePinNote"
    @click="handleClick($event, undefined, true)"
    @delete="deleteNote"
  />

  <ul class="notes" ref="notesList">
    <li
      v-for="note in notesToShow"
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
