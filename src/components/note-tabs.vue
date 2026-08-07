<script setup lang="ts">
import { directory } from "@/storage/directory";
import { removeOpenNote, setActiveNote, state } from "@/storage/state";
import { computed } from "vue";
import CarbonClose from "~icons/carbon/close";

const tabs = computed(() => {
  return state.open_notes.slice().map((it) => {
    return [it, directory.value?.value.notes[it] ?? "Deleted"];
  }) as [string, string][];
});

function handleRemove(e: MouseEvent, id: string) {
  e.stopPropagation();

  removeOpenNote(id);
}
</script>

<template>
  <div class="mdst-tabs-list" role="tablist" v-if="tabs.length">
    <button
      v-for="[noteId, noteName] in tabs"
      class="mdst-tab"
      role="tab"
      :data-state='state.active_note === noteId ? "active" : "inactive"'
      @click="setActiveNote(noteId)"
      :id="noteId"
    >
      <div class="mdst-truncate">
        {{ noteName }}
      </div>
      <div class="tab__actions">
        <CarbonClose
          style="color: var(--mdst-color-error)"
          @click="handleRemove($event, noteId)"
        />
      </div>
    </button>
  </div>
</template>
