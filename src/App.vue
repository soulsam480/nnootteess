<script setup lang="ts">
import Header from "@/components/header.vue";
import Login from "@/components/login.vue";
import NoteTabs from "@/components/note-tabs.vue";
import Sidebar from "@/components/sidebar.vue";
import Tab from "@/components/tab.vue";
import { LocalStorage, storageKey } from "@/storage/local";
import { state } from "@/storage/state";
import { user } from "@/storage/user";
import { MilkdownProvider } from "@milkdown/vue";
import { computed, provide, Suspense, watch } from "vue";
import { activeNoteIds } from "./storage/groups";

const props = defineProps<{
  storage: LocalStorage;
}>();

provide(storageKey, props.storage);

const drawer = computed(() => state.drawer_open ?? false);

watch(
  drawer,
  (state) => document.body.dataset.drawerOpen = state.toString(),
);
</script>

<template>
  <MilkdownProvider>
    <template v-if='user.state === "authenticated" && user.id'>
      <Header />
      <div class="arena">
        <Sidebar />

        <div class="mdst-tabs">
          <NoteTabs />
          <div class="panels-container" :data-count="activeNoteIds.size">
            <Suspense v-for="noteId in activeNoteIds" :key="noteId">
              <Tab :id="noteId" />

              <template #fallback>
                <div
                  style="display: flex; align-items: center; gap: var(--mdst-space-sm); color: var(--mdst-color-muted)"
                >
                  <span
                    class="mdst-spinner mdst-spinner--sm"
                    role="status"
                    aria-label="Loading"
                  ></span>
                  <span>Loading…</span>
                </div>
              </template>
            </Suspense>
          </div>
        </div>
      </div>
    </template>

    <Login v-else />
  </MilkdownProvider>
</template>
