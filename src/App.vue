<script setup lang="ts">
import "@/components/commands/state";
import Header from "@/components/header.vue";
import Login from "@/components/login.vue";
import NoteTabs from "@/components/note-tabs.vue";
import Drawer from "@/components/drawer.vue";
import { LocalStorage, storageKey } from "@/storage/local";
import { drawerOpen } from "@/storage/state";
import { user } from "@/storage/user";
import { MilkdownProvider } from "@milkdown/vue";
import { defineAsyncComponent, provide, Suspense, watchEffect } from "vue";
import { activeNoteIds } from "./storage/tabGroups";
import DeleteNoteConfirmation from "./components/delete-note-confirmation.vue";
import EmptyState from "./components/empty-state.vue";
import ImportNotes from "./components/import-notes.vue";
import Settings from "./components/settings.vue";
import CommandBar from "./components/commands/command-bar.vue";
import Toasts from "./components/toasts.vue";
import { editorReadonlyEnabled } from "./components/text-editor.vue";

const Tab = defineAsyncComponent(async () => {
  return await import("./components/tab.vue");
});

const props = defineProps<{
  storage: LocalStorage;
}>();

provide(storageKey, props.storage);

watchEffect(() => {
  document.body.dataset.drawerOpen = drawerOpen.value.toString();
});

watchEffect(() => {
  document.body.dataset.editorReadonly = editorReadonlyEnabled.value.toString();
});
</script>

<template>
  <MilkdownProvider>
    <template v-if="user.state === 'authenticated' && user.id">
      <DeleteNoteConfirmation />
      <CommandBar />
      <ImportNotes />
      <Settings />

      <Header />
      <div class="arena">
        <Drawer />

        <div class="mdst-tabs" v-if="activeNoteIds.length > 0">
          <NoteTabs />
          <div class="panels-container" :data-count="activeNoteIds.length">
            <Suspense v-for="[tabId, noteId] in activeNoteIds" :key="`${tabId}-${noteId}`">
              <Tab :id="noteId" :tabId="tabId" />

              <template #fallback>
                <div
                  style="
                    display: flex;
                    align-items: center;
                    gap: var(--mdst-space-sm);
                    color: var(--mdst-color-muted);
                  "
                >
                  <span class="mdst-spinner mdst-spinner--sm" role="status" aria-label="Loading" />
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

  <Toasts />
</template>
