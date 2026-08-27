<script setup lang="ts">
import { state, toggleDrawer } from "@/storage/state";
import { computed } from "vue";
import CarbonSidePanelCloseFilled from "~icons/carbon/side-panel-close-filled";
import CarbonSidePanelOpenFilled from "~icons/carbon/side-panel-open-filled";

const drawer = computed(() => state.drawer_open ?? false);

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
  >
    <CarbonSidePanelOpenFilled v-if="!drawer" />
    <CarbonSidePanelCloseFilled v-else />

    <template v-if="$props.labelled">
      Toggle Drawer
    </template>
  </button>
</template>
