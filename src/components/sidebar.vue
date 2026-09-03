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
import { state } from "@/storage/state";
import { computed, ref } from "vue";
import Notes from "./notes.vue";
import CarbonDocumentAdd from "~icons/carbon/document-add";
import CarbonCode from "~icons/carbon/code";
import DrawerToggle from "@/components/drawer-toggle.vue";
import { openNote } from "@/storage/tabGroups";
import CarbonExport from "~icons/carbon/export";
// import CarbonDownload from "~icons/carbon/download";

const drawer = computed(() => state.drawer_open ?? false);
</script>

<template>
  <dialog
    class="mdst-drawer mdst-drawer--left sidebar"
    :open="drawer"
    @close.prevent=""
  >
    <div class="sidebar__actions">
      <button
        class="mdst-button mdst-button--ghost mdst-button--sm tooltip tooltip--right"
        @click="addNewNote"
        data-tooltip="Add a new note"
      >
        <CarbonDocumentAdd />
      </button>

      <button
        class="mdst-button mdst-button--ghost mdst-button--sm tooltip tooltip--right"
        @click="addNewCode"
        data-tooltip="Add code snippet"
      >
        <CarbonCode />
      </button>

      <button
        class="mdst-button mdst-button--ghost mdst-button--sm tooltip tooltip--right"
        @click="noteAPI.exportNotes()"
        data-tooltip="Export notes"
      >
        <CarbonExport />
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
