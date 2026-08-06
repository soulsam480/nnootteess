<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import { setActiveNote, state } from "@/storage/state";
import CarbonTrashCan from "~icons/carbon/trash-can";

function selectNote(id: string) {
  setActiveNote(id);
}

async function deleteNote(event: Event, id: string) {
  event.stopPropagation();
  await noteAPI.delete(id);
}

const notes = await noteAPI.all();
</script>

<template>
  <ul class="notes">
    <li
      v-for="note in notes"
      class="link"
      :class="{ active: state.active_note === note.id }"
      @click="selectNote(note.id)"
    >
      {{ note.value.name }}

      <span class="link__actions">
        <span
          @click="deleteNote($event, note.id)"
          class="link__actions--delete"
        >
          <CarbonTrashCan />
        </span>
      </span>
    </li>
  </ul>

  <p v-if="notes.length === 0" class="mdst-p--muted">
    No notes yet
  </p>
</template>
