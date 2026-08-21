<script setup lang="ts">
import { notes } from "@/storage/notes";
import { removeOpenNote, setActiveNote, state } from "@/storage/state";
import { computed } from "vue";
import CarbonClose from "~icons/carbon/close";

const tabs = computed(() => {
  return notes.value.notes.filter((it) => state.open_notes.includes(it.id));
});

function handleRemove(e: Event, id: string) {
  e.stopPropagation();

  removeOpenNote(id);
}
</script>

<template>
  <div class="mdst-tabs-list" role="tablist" v-if="tabs.length">
    <button
      v-for="{ id: noteId, value: { name: noteName } } in tabs"
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
          @click="handleRemove($event, noteId)"
        />
      </div>
    </button>
  </div>
</template>
