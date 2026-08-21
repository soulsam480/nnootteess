<script setup lang="ts">
import * as noteAPI from "@/storage/notes";
import { setActiveNote, state } from "@/storage/state";
import { computed, ref } from "vue";
import Notes from "./notes.vue";
import CarbonDocumentAdd from "~icons/carbon/document-add";
import CarbonCode from "~icons/carbon/code";
import DrawerToggle from "@/components/drawer-toggle.vue";

const isMakingNote = ref(false);

async function addNewNote() {
  if (isMakingNote.value) return;

  isMakingNote.value = true;

  const note = await noteAPI.create("Untitled");

  setActiveNote(note.id);

  isMakingNote.value = false;
}

async function addNewCode() {
  if (isMakingNote.value) return;

  isMakingNote.value = true;

  const note = await noteAPI.createCode("Untitled snippet", "json");

  setActiveNote(note.id);

  isMakingNote.value = false;
}

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

      <DrawerToggle />
    </div>
    <div class="mdst-drawer-body">
      <Notes />
    </div>
  </dialog>
</template>
