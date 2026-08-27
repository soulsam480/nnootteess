<script setup lang="ts">
import { noteToBeDeleted } from "@/storage/notes";
import { closeNote } from "@/storage/tabGroups";
import { computed } from "vue";
import * as noteAPI from "@/storage/notes";

function handleToggle(event: ToggleEvent) {
  if (event.newState !== "open") {
    noteToBeDeleted.value = null;
  }
}

const noteName = computed(() => noteToBeDeleted.value?.value.name);

async function handleDelete() {
  if (!noteToBeDeleted.value) return;

  try {
    await closeNote(noteToBeDeleted.value.id);
    await noteAPI.delete(noteToBeDeleted.value.id);
  } finally {
    const el = document.querySelector<HTMLElement>("#delete-note-confirmation");

    el?.hidePopover();
  }
}
</script>

<template>
  <div
    id="delete-note-confirmation"
    class="mdst-popover delete-note-confirmation"
    popover
    @toggle="handleToggle"
  >
    <div>
      <h3>Delete {{ noteName }}?</h3>
      <p>This action is irreversible. This will sync to all your devices.</p>
    </div>

    <div class="delete-note-confirmation__actions">
      <button
        type="button"
        popovertarget="delete-note-confirmation"
        popovertargetaction="hide"
        class="mdst-button mdst-button--sm delete-note-confirmation__cancel"
      >
        Cancel
      </button>
      <button
        @click="handleDelete"
        type="button"
        class="mdst-button mdst-button--sm delete-note-confirmation__delete"
      >
        Yes, Delete
      </button>
    </div>
  </div>
</template>
