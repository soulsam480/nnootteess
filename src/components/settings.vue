<script setup lang="ts">
import { ref } from "vue";
import { editorVimEnabled } from "./code-editor.vue";
import { computedAsync, onKeyStroke } from "@vueuse/core";
import { isTyping } from "@/utils/events";
import { sm } from "@/storage/db";
import CarbonIbmCloudKeyProtect from "~icons/carbon/ibm-cloud-key-protect";
import CarbonKeychain from "~icons/carbon/keychain";

type Tab = "preferences" | "keybindings";

const tab = ref<Tab>("preferences");

function state(tab: Tab, self: Tab) {
  return tab === self ? "active" : "inactive";
}

const BINDINGS = [
  ["c", "Create snippet"],
  ["n", "Create note"],
  ["⌘ + k", "Open search"],
  ["d", "Toggle drawer"],
  ["E", "Export notes"],
  ["s", "Open settings"],
  ["⌘ + Shift + F", "Format snippet"],
];

onKeyStroke(["s"], (event) => {
  if (isTyping(event.target)) {
    return;
  }

  event.preventDefault();

  document.querySelector<HTMLDialogElement>("#settingsModal")?.showModal();
});

const hasPasskey = computedAsync(async () => {
  return await sm().hasExistingWebAuthnRegistration();
}, false);

async function handleCreatePasskey() {
  await sm().protectCurrentIdentityWithWebAuthn();
}
</script>

<template>
  <dialog
    id="settingsModal"
    class="mdst-dialog settings-dialog"
    style="width: auto"
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
            <p class="mdst-p mdst-p--sm">Setup a Passkey to auto log-in</p>
            <div>
              <p
                style="display: inline-flex; gap: var(--mdst-space-1); align-items: center"
                v-if="hasPasskey"
              >
                <CarbonKeychain stroke="var(--mdst-color-success)" /> <span>
                  Passkey Set
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
                  <span
                    class="mdst-code"
                  >
                    {{ key }}
                  </span>
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
