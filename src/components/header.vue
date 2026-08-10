<script setup lang="ts">
import { sm } from "@/storage/db";
import { storageKey } from "@/storage/local";
import { logout, user } from "@/storage/user";
import { inject } from "vue";
import CarbonIbmEngineeringRequirementsDoorsNext from "~icons/carbon/ibm-engineering-requirements-doors-next";

const storage = inject(storageKey);

function handleLogout() {
  if (!storage) return;

  logout(storage);
}
</script>

<template>
  <div class="header">
    <div class="home">
      NNOOTTEESS
    </div>

    <div class="user">
      Logged in: <span>{{
        user.id ? sm().abbrAddr(user.id) : "NOT LOGGED IN"
      }}</span>
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
