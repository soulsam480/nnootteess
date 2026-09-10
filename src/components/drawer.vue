<script module lang="ts">
const isMakingNote = ref(false);

export async function addNewNote() {
  if (isMakingNote.value) return;

  isMakingNote.value = true;

  const note = await noteAPI.create("Untitled");

  openNote(note.id);

  isMakingNote.value = false;
}

export async function addNewCode() {
  if (isMakingNote.value) return;

  isMakingNote.value = true;

  const note = await noteAPI.createCode("Untitled snippet", "json");

  openNote(note.id);

  isMakingNote.value = false;
}
</script>

<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import { drawerOpen } from "@/storage/state";
import { ref } from "vue";
import Notes, { notesOrder } from "./notes.vue";
import CarbonDocumentAdd from "~icons/carbon/document-add";
import CarbonCode from "~icons/carbon/code";
import DrawerToggle from "@/components/drawer-toggle.vue";
import { openNote } from "@/storage/tabGroups";
import CarbonExport from "~icons/carbon/export";
import { onKeyStroke } from "@vueuse/core";
import { isTyping } from "@/utils/events";
import CarbonSortAscending from "~icons/carbon/sort-ascending";
import CarbonSortDescending from "~icons/carbon/sort-descending";

// import CarbonDownload from "~icons/carbon/download";

onKeyStroke(["n"], (event) => {
  if (isTyping(event.target)) {
    return;
  }

  addNewNote();
});

onKeyStroke(["c"], (event) => {
  if (isTyping(event.target)) {
    return;
  }

  addNewCode();
});

onKeyStroke(["E"], (event) => {
  if (isTyping(event.target)) {
    return;
  }

  noteAPI.exportNotes();
});

function toggleOrder() {
  notesOrder.value = notesOrder.value === "asc" ? "desc" : "asc";
}
</script>

<template>
  <dialog
    class="mdst-drawer mdst-drawer--left sidebar"
    :open="drawerOpen"
    @close.prevent=""
  >
    <div class="sidebar__actions">
      <button
        class="mdst-button mdst-button--ghost mdst-button--sm"
        @click="addNewNote"
        title="Add new note"
      >
        <CarbonDocumentAdd />
      </button>

      <button
        class="mdst-button mdst-button--ghost mdst-button--sm"
        @click="addNewCode"
        title="Add new code snippet"
      >
        <CarbonCode />
      </button>

      <button
        class="mdst-button mdst-button--ghost mdst-button--sm"
        @click="noteAPI.exportNotes()"
        title="Export notes"
      >
        <CarbonExport />
      </button>

      <button
        class="mdst-button mdst-button--ghost mdst-button--sm"
        @click="toggleOrder"
        title="Toggle note order"
      >
        <CarbonSortAscending v-if='notesOrder === "asc"' />
        <CarbonSortDescending v-else />
      </button>

      <!-- <button -->
      <!--   class="mdst-button mdst-button--ghost mdst-button--sm tooltip tooltip--right" -->
      <!--   commandfor="import-notes-modal" -->
      <!--   command="show-modal" -->
      <!--   data-tooltip="Import notes" -->
      <!-- > -->
      <!--   <CarbonDownload /> -->
      <!-- </button> -->

      <DrawerToggle />
    </div>
    <div class="mdst-drawer-body">
      <Notes />
    </div>
  </dialog>
</template>
