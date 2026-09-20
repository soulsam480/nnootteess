<script setup lang="ts">
import CarbonDocumentAdd from "~icons/carbon/document-add";
import CarbonCode from "~icons/carbon/code";
import DrawerToggle from "@/components/drawer-toggle.vue";
import CarbonLogoGithub from "~icons/carbon/logo-github";
import { addNewCode, addNewNote } from "./drawer.vue";
import CarbonMacCommand from "~icons/carbon/mac-command";
import Kbd from "./kbd.vue";

declare const __BUILT_AT__: string;
declare const __COMMIT_REF__: string;

const buildTime = __BUILT_AT__ ?? "";
const sha = __COMMIT_REF__ ?? "";
</script>

<template>
  <div class="empty-state">
    <button
      class="mdst-button mdst-button--ghost"
      commandfor="commandBarDialog"
      command="show-modal"
    >
      <CarbonMacCommand />
      Open Command Palette
      <span class="kbd__wrapper">
        <Kbd kbd="$mod+KeyK" />
      </span>
    </button>

    <button class="mdst-button mdst-button--ghost" @click="addNewNote">
      <CarbonDocumentAdd />
      Create a Note
      <span class="kbd__wrapper">
        <Kbd kbd="Alt+KeyN" />
      </span>
    </button>

    <button class="mdst-button mdst-button--ghost" @click="addNewCode">
      <CarbonCode />
      Create a Snippet

      <span class="kbd__wrapper">
        <Kbd kbd="Alt+KeyC" />
      </span>
    </button>

    <DrawerToggle labelled />

    <div class="empty-state__notes">
      <a
        href="https://github.com/soulsam480/nnootteess"
        class="mdst-a mdst-bold"
        target="_blank"
        rel="noopener noreferrer"
      >
        <CarbonLogoGithub /> GitHub
      </a>

      <a
        class="mdst-p--muted mdst-a"
        :href="`https://github.com/soulsam480/nnootteess/commit/${sha}`"
        target="_blank"
        rel="noopener noreferrer"
      >
        Built from <b>{{ sha }}</b> at <b>{{ buildTime }}</b>
      </a>

      <p class="mdst-p--muted">
        Tip: Right click / Long press on a note to see actions
      </p>
    </div>

    <footer>
      <p>
        Sambit Sahoo {{ new Date().getFullYear() }}&comma; MIT License
      </p>
    </footer>
  </div>
</template>
