<script setup lang="ts">
import { ref } from "vue";
import { editorVimEnabled } from "./code-editor.vue";
import { computedAsync } from "@vueuse/core";
import { sm } from "@/storage/db";
import CarbonIbmCloudKeyProtect from "~icons/carbon/ibm-cloud-key-protect";
import CarbonKeychain from "~icons/carbon/keychain";
import Kbd from "./kbd.vue";

type Tab = "preferences" | "keybindings";

const tab = ref<Tab>("preferences");

function state(tab: Tab, self: Tab) {
  return tab === self ? "active" : "inactive";
}

const BINDINGS = [
  ["Alt+KeyP", "Pin note"],
  ["Alt+KeyS", "Split note"],
  ["Alt+Shift+KeyD", "Delete note"],
  ["$mod+f", "Open search"],
  ["Alt+KeyN", "Create new note"],
  ["Alt+KeyC", "Create new code"],
  ["Alt+KeyD", "Toggle drawer"],
  ["Alt+KeyE", "Export notes"],
  ["Alt+KeyO", "Sort notes"],
  ["Alt+KeyS", "Open settings"],
  ["⌘ + Shift + f", "Format snippet"],
  ["Alt+KeyV", "Toggle Vim Mode"],
  ["Alt+KeyR", "Toggle Readonly Mode"],
];

const hasPasskey = computedAsync(async () => {
  return await sm().hasExistingWebAuthnRegistration();
}, false);

async function handleCreatePasskey() {
  await sm().protectCurrentIdentityWithWebAuthn();
}

function handleClose() {
  tab.value = "preferences";
}
</script>

<template>
  <dialog
    id="settingsModal"
    class="mdst-dialog settings-dialog"
    style="width: auto"
    @close="handleClose"
  >
    <div class="mdst-dialog-header">
      <h2 class="mdst-dialog-title">Settings</h2>
      <button
        class="mdst-dialog-close"
        commandfor="settingsModal"
        command="close"
      >
        ✕
      </button>
    </div>
    <div class="mdst-dialog-body">
      <div class="mdst-tabs">
        <div class="mdst-tabs-list" role="tablist">
          <button
            class="mdst-tab"
            role="tab"
            :data-state='state(tab, "preferences")'
            @click='tab = "preferences"'
          >
            Preferences
          </button>
          <button
            class="mdst-tab"
            role="tab"
            :data-state='state(tab, "keybindings")'
            @click='tab = "keybindings"'
          >
            Keybindings
          </button>
        </div>
        <div
          class="mdst-tabs-panel settings__preferences"
          role="tabpanel"
          :data-state='state(tab, "preferences")'
        >
          <label class="mdst-checkbox-label vim-toggle">
            Enable Vim mode
            <input
              v-model="editorVimEnabled"
              type="checkbox"
              class="mdst-checkbox"
            />
          </label>

          <hr class="mdst-hr mdst-hr--flush" />

          <div class="settings__auth">
            <p class="mdst-p mdst-p--sm">
              Setup a Passkey for persistent & secure login
            </p>
            <div>
              <p
                style="display: inline-flex; gap: var(--mdst-space-1); align-items: center"
                v-if="hasPasskey"
              >
                <CarbonKeychain stroke="var(--mdst-color-success)" /> <span>
                  Set
                </span>
              </p>
              <button
                v-else
                class="mdst-button mdst-button--sm"
                @click="handleCreatePasskey"
              >
                <CarbonIbmCloudKeyProtect />
                Create
              </button>
            </div>
          </div>
        </div>
        <div
          class="mdst-tabs-panel"
          role="tabpanel"
          :data-state='state(tab, "keybindings")'
        >
          <table class="mdst-table mdst-table--bordered">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="[key, action] in BINDINGS" :key="key">
                <td>
                  <div style="display: flex; gap: var(--mdst-space-1)">
                    <Kbd :kbd="key" />
                  </div>
                </td>
                <td>{{ action }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </dialog>
</template>
