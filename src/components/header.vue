<script setup lang="ts">
import { sm } from "@/storage/db";
import { storageKey } from "@/storage/local";
import { logout, user } from "@/storage/user";
import { inject } from "vue";
import CarbonIbmEngineeringRequirementsDoorsNext from "~icons/carbon/ibm-engineering-requirements-doors-next";
import DrawerToggle from "./drawer-toggle.vue";
import CarbonUser from "~icons/carbon/user";
import { onKeyStroke } from "@vueuse/core";
import { isTyping } from "@/utils/events";
import { toggleDrawer } from "@/storage/state";
import CarbonSettingsAdjust from "~icons/carbon/settings-adjust";

const storage = inject(storageKey);

function handleLogout() {
  if (!storage) return;

  logout(storage);
}

onKeyStroke(["d"], (event) => {
  if (isTyping(event.target)) {
    return;
  }

  toggleDrawer();
});
</script>

<template>
  <div class="header">
    <div class="header-left">
      <DrawerToggle />

      <div class="home">
        NNOOTTEESS
      </div>
    </div>

    <div class="user">
      <button
        class="mdst-button mdst-button--ghost drawer-toggle mdst-button--sm"
        commandfor="settingsModal"
        command="show-modal"
      >
        <CarbonSettingsAdjust />
      </button>

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
