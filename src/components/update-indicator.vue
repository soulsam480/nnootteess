<script setup lang="ts">
import { useRegisterSW } from "virtual:pwa-register/vue";
import { watch } from "vue";
import CarbonUpdateNow from "~icons/carbon/update-now";
import { showToast } from "./toasts.vue";

const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW();

watch(needRefresh, (value) => {
  if (!value) return;

  showToast({
    persistent: true,
    type: "info",
    message: "Update available",
    action: {
      label: "Reload",
      perform: updateServiceWorker,
    },
  });
});

watch(offlineReady, (value) => {
  if (!value) return;

  showToast({
    message: "App ready to work offline!",
    type: "success",
  });
});
</script>

<template>
  <button
    v-if="needRefresh"
    class="mdst-button mdst-button--sm update-reload mdst-button--ghost"
    @click="updateServiceWorker()"
  >
    <span class="update-reload__beacon" />
    <CarbonUpdateNow />
  </button>
</template>
