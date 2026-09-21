<script setup lang="ts">
import { closeNote, openNote, tabGroups } from "@/storage/tabGroups";
import { notes, TListNote } from "@/storage/notes";
import { NodeObject } from "genosdb";
import { computed } from "vue";
import CarbonClose from "~icons/carbon/close";
import { ITabGroup } from "@/storage/indexeddb";

const tabs = computed(() => {
  const final = tabGroups.value.reduce<
    Record<string, [ITabGroup, NodeObject<TListNote>[]]>
  >((groups, group) => {
    if (group.id === undefined) return groups;

    groups[group.id] ??= [group, []];

    for (const edge of group.notes) {
      if (notes.value.index.has(edge)) {
        groups[group.id][1].push(
          notes.value.index.get(edge) as NodeObject<TListNote>,
        );
      }
    }

    return groups;
  }, {});

  return Object.values(final);
});

function handleRemove(e: Event, id: string, groupId: number) {
  e.stopPropagation();

  closeNote(id, groupId);
}
</script>

<template>
  <div class="tabs-container">
    <template v-for="[tab, notes] in tabs" :key="tab.id">
      <div class="mdst-tabs-list" role="tablist" v-if="tabs.length">
        <button
          v-for="{ id: noteId, value: { name: noteName } } in notes"
          :key="noteId"
          class="mdst-tab"
          role="tab"
          :data-state='tab.active === noteId ? "active" : "inactive"'
          @click="openNote(noteId)"
          :id="noteId"
          :title="noteName"
        >
          <div class="mdst-truncate">
            {{ noteName }}
          </div>
          <div class="tab__actions">
            <CarbonClose
              @click="handleRemove($event, noteId, tab.id!)"
            />
          </div>
        </button>
      </div>
    </template>
  </div>
</template>
