<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import { removeOpenNote, setActiveNote, state } from "@/storage/state";
import { computed } from "vue";
import CarbonTrashCan from "~icons/carbon/trash-can";

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
</script>

<template>
  <ul class="notes">
    <li
      v-for="note in noteAPI.notes.value.notes"
      class="link"
      :class="{ active: state.active_note === note.id }"
      @click="setActiveNote(note.id)"
    >
      <div class="mdst-truncate">
        {{ note.value.name }}
      </div>
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
