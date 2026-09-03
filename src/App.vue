<script setup lang="ts">
import Header from "@/components/header.vue";
import Login from "@/components/login.vue";
import NoteTabs from "@/components/note-tabs.vue";
import Sidebar from "@/components/sidebar.vue";
import { LocalStorage, storageKey } from "@/storage/local";
import { state } from "@/storage/state";
import { user } from "@/storage/user";
import { MilkdownProvider } from "@milkdown/vue";
import { defineAsyncComponent, provide, Suspense, watchEffect } from "vue";
import { activeNoteIds } from "./storage/tabGroups";
import DeleteNoteConfirmation from "./components/delete-note-confirmation.vue";
import EmptyState from "./components/empty-state.vue";
import ImportNotes from "./components/import-notes.vue";
import Search from "./components/search.vue";
import Settings from "./components/settings.vue";

const Tab = defineAsyncComponent(async () => {
  return await import("./components/tab.vue");
});

const props = defineProps<{
  storage: LocalStorage;
}>();

provide(storageKey, props.storage);

watchEffect(
  () => {
    document.body.dataset.drawerOpen = (state.drawer_open ?? false).toString();
  },
);
</script>

<template>
  <MilkdownProvider>
    <template v-if='user.state === "authenticated" && user.id'>
      <DeleteNoteConfirmation />
      <ImportNotes />
      <Search />
      <Settings />

      <Header />
      <div class="arena">
        <Sidebar />

        <div class="mdst-tabs" v-if="activeNoteIds.length > 0">
          <NoteTabs />
          <div class="panels-container" :data-count="activeNoteIds.length">
            <Suspense
              v-for="[tabId, noteId] in activeNoteIds"
              :key="`${tabId}-${noteId}`"
            >
              <Tab :id="noteId" :tabId="tabId" />

              <template #fallback>
                <div
                  style="display: flex; align-items: center; gap: var(--mdst-space-sm); color: var(--mdst-color-muted)"
                >
                  <span
                    class="mdst-spinner mdst-spinner--sm"
                    role="status"
                    aria-label="Loading"
                  />
                  <span>Loading…</span>
                </div>
              </template>
            </Suspense>
          </div>
        </div>

        <EmptyState v-else />
      </div>
    </template>

    <Login v-else />
  </MilkdownProvider>
</template>
