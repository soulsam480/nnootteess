import { CommandConfig } from "@/components/commands/types";
import { addNewCode, addNewNote } from "@/components/drawer.vue";
import { exportNotes } from "@/storage/notes";
import CarbonDocumentAdd from "~icons/carbon/document-add";
import CarbonCode from "~icons/carbon/code";
import CarbonExport from "~icons/carbon/export";
import { drawerOpen } from "@/storage/state";
import CarbonSidePanelCloseFilled from "~icons/carbon/side-panel-close-filled";
import CarbonSettingsAdjust from "~icons/carbon/settings-adjust";
import { editorVimEnabled } from "@/components/code-editor.vue";
import VscodeIconsFileTypeVim from "~icons/vscode-icons/file-type-vim";
import { notesOrder } from "@/components/notes.vue";
import CarbonSortAscending from "~icons/carbon/sort-ascending";
import CarbonSortDescending from "~icons/carbon/sort-descending";
import { h } from "vue";
import { showToast } from "@/components/toasts.vue";
import CarbonWindyStrong from "~icons/carbon/windy-strong";
import { editorReadonlyEnabled } from "@/components/text-editor.vue";

export const SYSTEM_COMMANDS: CommandConfig[] = [
  {
    id: "create-snippet",
    name: "Create snippet",
    actions: {
      default: {
        shortcut: "Alt+KeyC",
        async perform() {
          await addNewCode();
        },
      },
    },
    icon: CarbonCode,
  },
  {
    id: "create-note",
    name: "Create note",
    actions: {
      default: {
        shortcut: "Alt+KeyN",
        async perform() {
          await addNewNote();
        },
      },
    },
    icon: CarbonDocumentAdd,
  },
  {
    id: "export-notes",
    name: "Export notes",
    actions: {
      default: {
        shortcut: "Alt+KeyE",
        async perform() {
          await exportNotes();
        },
      },
    },
    icon: CarbonExport,
  },
  {
    id: "sort-notes",
    name: () => `Sort notes (${notesOrder.value})`,
    actions: {
      default: {
        shortcut: "Alt+KeyO",
        async perform() {
          notesOrder.value = notesOrder.value === "asc" ? "desc" : "asc";

          showToast({
            message: `Showing notes in ${notesOrder.value === "asc" ? "ascending" : "descending"} order`,
          });
        },
      },
    },
    icon: () => (notesOrder.value === "asc" ? h(CarbonSortAscending) : h(CarbonSortDescending)),
  },
  {
    id: "toggle-drawer",
    name: "Toggle Drawer",
    actions: {
      default: {
        shortcut: "Alt+KeyD",
        async perform() {
          drawerOpen.value = !drawerOpen.value;
        },
      },
    },
    icon: CarbonSidePanelCloseFilled,
  },
  {
    id: "open-settings",
    name: "Open Settings",
    group: "Settings",
    actions: {
      default: {
        shortcut: "Alt+KeyS",
        async perform() {
          window.requestAnimationFrame(() => {
            document.querySelector<HTMLDialogElement>("#settingsModal")?.showModal();
          });
        },
      },
    },
    icon: CarbonSettingsAdjust,
  },
  {
    id: "toggle-vim-mode",
    name: () => `${editorVimEnabled.value ? "Disable Vim Mode" : "Enable Vim Mode"}`,
    group: "Settings",
    actions: {
      default: {
        shortcut: "Alt+KeyV",
        async perform() {
          const prev = editorVimEnabled.value;
          editorVimEnabled.value = !editorVimEnabled.value;

          showToast({
            message: prev ? "Vim mode disabled" : "Vim mode enabled",
          });
        },
      },
    },
    icon: VscodeIconsFileTypeVim,
  },
  {
    id: "toggle-readonly-mode",
    name: () => `${editorReadonlyEnabled.value ? "Disable Readonly Mode" : "Enable Readonly Mode"}`,
    group: "Settings",
    actions: {
      default: {
        shortcut: "Alt+KeyR",
        async perform() {
          const prev = editorReadonlyEnabled.value;

          editorReadonlyEnabled.value = !editorReadonlyEnabled.value;

          showToast({
            message: prev ? "Readonly mode disabled" : "Readonly mode enabled",
          });
        },
      },
    },
    icon: CarbonWindyStrong,
  },
];
