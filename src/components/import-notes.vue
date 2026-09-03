<script setup lang="ts">
import { importNotes } from "@/storage/notes";
import { shallowRef } from "vue";

const files = shallowRef<FileList | null>(null);

function handleChange(e: Event) {
  const from = (e.target as HTMLInputElement).files;

  if (!from) return;

  files.value = from;
}

function handleImport() {
  if (!files.value) return;

  importNotes(files.value);
}
</script>

<template>
  <dialog id="import-notes-modal" class="mdst-dialog" @close="files = null">
    <div class="mdst-dialog-header">
      <h2 class="mdst-dialog-title">Import notes into nnootteess</h2>
      <button
        class="mdst-dialog-close"
        commandfor="import-notes-modal"
        command="close"
      >
        ✕
      </button>
    </div>
    <div class="mdst-dialog-body">
      <div class="mdst-file-input">
        <input
          @change="handleChange"
          multiple
          accept=".md, .ts, .js, .json"
          type="file"
          class="mdst-input mdst-file-input__field"
        />
      </div>
    </div>
    <div class="mdst-dialog-footer">
      <button
        class="mdst-button mdst-button--ghost"
        commandfor="import-notes-modal"
        command="close"
      >
        Cancel
      </button>
      <button
        class="mdst-button mdst-button--inverted"
        commandfor="import-notes-modal"
        command="close"
        @click="handleImport"
      >
        Confirm
      </button>
    </div>
  </dialog>
</template>
