<script setup lang="ts">
import CarbonDocumentAdd from "~icons/carbon/document-add";
import CarbonCode from "~icons/carbon/code";
import DrawerToggle from "@/components/drawer-toggle.vue";
import CarbonLogoGithub from "~icons/carbon/logo-github";
import { addNewCode, addNewNote } from "./sidebar.vue";
</script>

<template>
  <div class="empty-state">
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
