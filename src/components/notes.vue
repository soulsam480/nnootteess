<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import {
  removeOpenNote,
  setActiveNote,
  state,
  toggleDrawer,
} from "@/storage/state";
import { computed } from "vue";
import CarbonTrashCan from "~icons/carbon/trash-can";
import CarbonDocument from "~icons/carbon/document";
import CarbonCode from "~icons/carbon/code";
import { formatDate } from "@/utils/date";
import { useMediaQuery } from "@vueuse/core";
import { NodeObject } from "genosdb";
import { LANG_TO_COLOR } from "@/utils/codemirror";

async function deleteNote(
  event: Event,
  note: { id: string; value: { name: string } },
) {
  event.stopPropagation();

  removeOpenNote(note.id);

  await noteAPI.delete(note.id);
}

const hasNotes = computed(() => {
  return noteAPI.notes.value.notes.length > 0;
});

const isSmallScreen = useMediaQuery("(max-width: 600px)");

function handleClick(note: NodeObject<noteAPI.TListNote>) {
  setActiveNote(note.id);

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
      :class="{ active: state.active_note === note.id }"
      @click="handleClick(note)"
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
        <span
          @click="deleteNote($event, note)"
          class="link__actions--delete"
        >
          <CarbonTrashCan />
        </span>
      </span>
    </li>
    <p v-if="!hasNotes" class="mdst-p--muted">
      No notes yet
    </p>
  </ul>
</template>
