<script setup lang="ts">
import { directory, sync } from "@/storage/directory";
import * as noteAPI from "@/storage/notes";
import { invalidateQueries } from "@/storage/query";
import { setActiveNote, state } from "@/storage/state";
import { computed } from "vue";
import CarbonTrashCan from "~icons/carbon/trash-can";

async function deleteNote(
  event: Event,
  note: { id: string; value: { name: string } },
) {
  event.stopPropagation();

  if (state.active_note === note.id) {
    setActiveNote(null);
  }

  await noteAPI.delete(note.id);
  sync(note, "remove");
  invalidateQueries(noteAPI.queryKeys.all());
}

const hasNotes = computed(() => {
  if (!directory.value) {
    return false;
  }

  for (const _k in directory.value.value.notes) {
    return true;
  }

  return false;
});
</script>

<template>
  <ul class="notes" v-if="directory">
    <li
      v-for="(noteName, noteId) in directory.value.notes"
      class="link"
      :class="{ active: state.active_note === noteId }"
      @click="setActiveNote(noteId)"
    >
      {{ noteName }}

      <span class="link__actions">
        <span
          @click="deleteNote($event, { id: noteId, value: { name: noteName } })"
          class="link__actions--delete"
        >
          <CarbonTrashCan />
        </span>
      </span>
    </li>
  </ul>

  <p v-if="!hasNotes" class="mdst-p--muted">
    No notes yet
  </p>
</template>
