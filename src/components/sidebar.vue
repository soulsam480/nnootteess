<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import { setActiveNote } from "@/storage/state";
import { ref, Suspense } from "vue";
import Notes from "./notes.vue";
import CarbonDocumentAdd from "~icons/carbon/document-add";

const isMakingNote = ref(false);

async function addNewNote() {
  if (isMakingNote.value) return;

  isMakingNote.value = true;

  const note = await noteAPI.create("Untitled");

  setActiveNote(note.id);

  isMakingNote.value = false;
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar__actions">
      <button
        class="mdst-button mdst-button--ghost mdst-button--sm"
        @click="addNewNote"
      >
        <CarbonDocumentAdd />
      </button>
    </div>

    <Suspense>
      <Notes />
    </Suspense>
  </div>
</template>
