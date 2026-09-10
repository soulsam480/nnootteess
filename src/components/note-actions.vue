<script setup lang="ts">
import CarbonTrashCan from "~icons/carbon/trash-can";
import CarbonSplitScreen from "~icons/carbon/split-screen";
import { onMounted } from "vue";

defineEmits<{
  toggle: [event: ToggleEvent];
  togglePin: [event: MouseEvent];
  click: [event: MouseEvent];
  delete: [event: MouseEvent];
}>();

onMounted(() => {
  document.addEventListener("pointerdown", (event) => {
    const pop = document.querySelector<HTMLElement>("#note-actions");

    if (!pop?.matches(":popover-open")) return;

    const target = event.target as Node;

    if (!pop.contains(target)) {
      pop.hidePopover();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const pop = document.querySelector<HTMLElement>("#note-actions");

    if (pop?.matches(":popover-open")) {
      pop.hidePopover();
    }
  });
});
</script>

<template>
  <div
    id="note-actions"
    class="mdst-popover mdst-popover--anchored mdst-popover--sm note-actions"
    popover="manual"
    @toggle='$emit("toggle", $event)'
  >
    <p class="mdst-p--muted note-actions__header">
      ACTIONS
    </p>

    <button
      @click='$emit("togglePin", $event)'
      class="mdst-button mdst-button--sm mdst-button--ghost"
      title="Pin"
      type="button"
    >
      <CarbonPin />
      Pin/Un-pin
    </button>

    <button
      @click='$emit("click", $event)'
      title="Split"
      type="button"
      class="mdst-button mdst-button--sm mdst-button--ghost"
    >
      <CarbonSplitScreen />
      Split
    </button>

    <button
      @click='$emit("delete", $event)'
      class="mdst-button note-actions__delete mdst-button--sm mdst-button--ghost"
      title="Delete"
      popovertarget="delete-note-confirmation"
      type="button"
    >
      <CarbonTrashCan />
      Delete
    </button>
  </div>
</template>

<style scoped>
</style>
