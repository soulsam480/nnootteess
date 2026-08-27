<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import { toggleDrawer } from "@/storage/state";
import { computed } from "vue";
import CarbonTrashCan from "~icons/carbon/trash-can";
import CarbonDocument from "~icons/carbon/document";
import CarbonCode from "~icons/carbon/code";
import CarbonSplitScreen from "~icons/carbon/split-screen";
import { formatDate } from "@/utils/date";
import { useMediaQuery } from "@vueuse/core";
import { NodeObject } from "genosdb";
import { LANG_TO_COLOR } from "@/utils/codemirror";
import { activeNoteIds, openNote } from "@/storage/tabGroups";

async function deleteNote(
  event: Event,
  note: NodeObject<noteAPI.TListNote>,
) {
  event.stopPropagation();

  noteAPI.noteToBeDeleted.value = note;
}

const hasNotes = computed(() => {
  return noteAPI.notes.value.notes.length > 0;
});

const isSmallScreen = useMediaQuery("(max-width: 600px)");

function handleClick(
  event: MouseEvent,
  note: NodeObject<noteAPI.TListNote>,
  split?: boolean,
) {
  event.stopPropagation();

  split = split ?? (event.ctrlKey || event.metaKey);

  openNote(
    note.id,
    split,
  );

  if (isSmallScreen.value) {
    toggleDrawer(false);
  }
}
</script>

<template>
  <ul class="notes">
    <li
      v-for="note in noteAPI.notes.value.notes"
      class="link"
      :class="{ active: activeNoteIds.some((it) => it[1] === note.id) }"
      @click="handleClick($event, note)"
      :title="formatDate(note.value.created_at)"
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
      <span class="link__actions">
        <button
          @click="handleClick($event, note, true)"
          class="link__actions--split"
          title="Split"
          type="button"
        >
          <CarbonSplitScreen />
        </button>

        <button
          @click="deleteNote($event, note)"
          class="link__actions--delete"
          title="Delete"
          popovertarget="delete-note-confirmation"
          type="button"
        >
          <CarbonTrashCan />
        </button>
      </span>
    </li>
    <p v-if="!hasNotes" class="mdst-p--muted">
      No notes yet
    </p>
  </ul>
</template>
