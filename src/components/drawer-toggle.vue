<script setup lang="ts">
import { state, toggleDrawer } from "@/storage/state";
import { computed } from "vue";
import CarbonSidePanelCloseFilled from "~icons/carbon/side-panel-close-filled";
import CarbonSidePanelOpenFilled from "~icons/carbon/side-panel-open-filled";

const drawer = computed(() => state.drawer_open ?? false);
</script>

<template>
  <button
    class="mdst-button mdst-button--ghost mdst-button--sm drawer-toggle"
    @click="toggleDrawer()"
  >
    <CarbonSidePanelOpenFilled v-if="!drawer" />
    <CarbonSidePanelCloseFilled v-else />
  </button>
</template>
