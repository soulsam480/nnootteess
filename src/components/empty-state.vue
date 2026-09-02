<script setup lang="ts">
import CarbonDocumentAdd from "~icons/carbon/document-add";
import CarbonCode from "~icons/carbon/code";
import DrawerToggle from "@/components/drawer-toggle.vue";
import CarbonLogoGithub from "~icons/carbon/logo-github";
import CarbonStackedMove from "~icons/carbon/stacked-move";
import { addNewCode, addNewNote } from "./sidebar.vue";
import { legacyDb } from "@/storage/db";
import { computed, inject } from "vue";
import { storageKey } from "@/storage/local";
import { PASS_KEY, PersistedMemonic } from "@/storage/user";
import { migrate, migrationStatus } from "@/storage/migrator";
import { state } from "@/storage/state";

const storage = inject(storageKey);

async function handleMigration() {
  if (!storage) return;

  const result = await storage.get<Partial<PersistedMemonic>>(PASS_KEY);

  const previousMemonic = result?.mnemonic;

  if (!previousMemonic) return;

  const identity: Record<string, string> | null = await legacyDb.sm()
    .loginOrRecoverUserWithMnemonic(previousMemonic);

  if (!identity) {
    return;
  }

  await migrate(identity.address);
}

const isLoading = computed(() =>
  ["state", "notes", "tabs"].includes(migrationStatus.value)
);
</script>

<template>
  <div class="empty-state">
    <button
      v-if="!state.migrated_at"
      class="mdst-button mdst-button--ghost"
      @click="handleMigration"
    >
      <span
        v-if="isLoading"
        class="mdst-spinner"
        role="status"
        aria-label="Loading"
      />

      <CarbonStackedMove v-else />
      Migrate legacy version notes on device
    </button>

    <button class="mdst-button mdst-button--ghost" @click="addNewNote">
      <CarbonDocumentAdd />
      Create a Note
    </button>

    <button class="mdst-button mdst-button--ghost" @click="addNewCode">
      <CarbonCode />
      Create a Snippet
    </button>

    <DrawerToggle labelled />

    <a
      href="https://github.com/soulsam480/nnootteess"
      class="mdst-a mdst-bold"
      target="_blank"
      rel="noopener noreferrer"
    >
      <CarbonLogoGithub /> GitHub
    </a>

    <footer>
      <p>
        Sambit Sahoo {{ new Date().getFullYear() }}&comma; MIT License
      </p>
    </footer>
  </div>
</template>
