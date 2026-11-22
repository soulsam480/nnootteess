<script setup lang="ts">
import { sm } from "@/storage/db";
import { storageKey } from "@/storage/local";
import { syncState } from "@/storage/sync";
import { logout, user } from "@/storage/user";
import { computed, inject } from "vue";
import CarbonIbmEngineeringRequirementsDoorsNext from "~icons/carbon/ibm-engineering-requirements-doors-next";
import CarbonMacCommand from "~icons/carbon/mac-command";
import DrawerToggle from "./drawer-toggle.vue";
import CarbonUser from "~icons/carbon/user";
import UpdateIndicator from "./update-indicator.vue";

const storage = inject(storageKey);

const syncLabel = computed(() => {
  const count = syncState.peers.length;
  return count === 1 ? "1 device in this vault" : `${count} devices in this vault`;
});

const peerTitle = computed(() => {
  const count = syncState.roomPeerCount;
  return `${count} peer connection${count === 1 ? "" : "s"}`;
});

function handleLogout() {
  if (!storage) return;

  logout(storage);
}
</script>

<template>
  <div class="header">
    <div class="header-left">
      <DrawerToggle />

      <div class="home">NOTESx2</div>
    </div>

    <div class="user">
      <button
        class="mdst-button mdst-button--sm update-reload mdst-button--ghost"
        commandfor="commandBarDialog"
        command="show-modal"
      >
        <CarbonMacCommand />
      </button>
      <button
        v-if="user.id"
        class="mdst-button mdst-button--sm mdst-button--ghost sync-status"
        :data-status="syncState.status"
        commandfor="syncPanel"
        command="show-modal"
        :title="peerTitle"
        :aria-label="syncLabel"
      >
        <span class="sync-status__dot" aria-hidden="true" />
        <span v-if="syncState.peers.length">{{ syncState.peers.length }}</span>
      </button>
      <UpdateIndicator />
      <CarbonUser />
      <span>{{ user.id ? sm().abbrAddr(user.id) : "NOT LOGGED IN" }}</span>
      <button
        v-if="user.id"
        class="mdst-button mdst-button--ghost mdst-button--sm user__logout tooltip tooltip--left"
        @click="handleLogout"
        data-tooltip="Logout"
      >
        <CarbonIbmEngineeringRequirementsDoorsNext />
      </button>
    </div>
  </div>
</template>
