<script setup lang="ts">
import { drawerOpen, toggleDrawer } from "@/storage/state";
import CarbonSidePanelCloseFilled from "~icons/carbon/side-panel-close-filled";
import CarbonSidePanelOpenFilled from "~icons/carbon/side-panel-open-filled";
import Kbd from "./kbd.vue";

const props = defineProps<{
  labelled?: boolean;
}>();
</script>

<template>
  <button
    :class='[
      "mdst-button mdst-button--ghost drawer-toggle",
      {
        "mdst-button--sm": $props.labelled !== true,
      },
    ]'
    @click="toggleDrawer()"
    title="Toggle drawer"
  >
    <CarbonSidePanelOpenFilled v-if="!drawerOpen" />
    <CarbonSidePanelCloseFilled v-else />

    <template v-if="$props.labelled">
      Toggle Drawer

      <Kbd kbd="Alt+KeyD" />
    </template>
  </button>
</template>
