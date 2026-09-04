<script setup lang="ts">
import { ref } from "vue";
import { editorVimEnabled } from "./code-editor.vue";
import { onKeyStroke } from "@vueuse/core";
import { isTyping } from "@/utils/events";

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
          class="mdst-tabs-panel"
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
