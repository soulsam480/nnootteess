<script setup lang="ts">
import CarbonDocumentAdd from "~icons/carbon/document-add";
import CarbonCode from "~icons/carbon/code";
import DrawerToggle from "@/components/drawer-toggle.vue";
import CarbonLogoGithub from "~icons/carbon/logo-github";
import { addNewCode, addNewNote } from "./drawer.vue";
import CarbonMacCommand from "~icons/carbon/mac-command";
import Kbd from "./kbd.vue";
</script>

<template>
  <div class="empty-state">
    <button
      class="mdst-button mdst-button--ghost"
      commandfor="searchModal"
      command="show-modal"
    >
      <CarbonMacCommand />
      Open Command Palette
      <Kbd kbd="$mod+KeyK" />
    </button>

    <button class="mdst-button mdst-button--ghost" @click="addNewNote">
      <CarbonDocumentAdd />
      Create a Note
      <Kbd kbd="Alt+KeyN" />
    </button>

    <button class="mdst-button mdst-button--ghost" @click="addNewCode">
      <CarbonCode />
      Create a Snippet

      <Kbd kbd="Alt+KeyC" />
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

    <p class="mdst-p--muted">
      Tip: Right click / Long press on a note to see actions
    </p>

    <footer>
      <p>
        Sambit Sahoo {{ new Date().getFullYear() }}&comma; MIT License
      </p>
    </footer>
  </div>
</template>
