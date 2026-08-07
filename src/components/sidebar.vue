<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import { setActiveNote } from "@/storage/state";
import { ref } from "vue";
import Notes from "./notes.vue";
import CarbonDocumentAdd from "~icons/carbon/document-add";
import { invalidateQueries } from "@/storage/query";
import { sync } from "@/storage/directory";

const isMakingNote = ref(false);

async function addNewNote() {
  if (isMakingNote.value) return;

  isMakingNote.value = true;

  const note = await noteAPI.create("Untitled");

  setActiveNote(note.id);

  invalidateQueries(noteAPI.queryKeys.all());
  sync(note, "add");

  isMakingNote.value = false;
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar__actions">
      <button
        class="mdst-button mdst-button--ghost mdst-button--sm tooltip tooltip--right"
        @click="addNewNote"
        data-tooltip="Add a new note"
      >
        <CarbonDocumentAdd />
      </button>
    </div>

    <Notes />
  </div>
</template>
