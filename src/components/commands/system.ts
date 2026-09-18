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
    id: "open-settings",
    name: "Open Settings",
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
    id: "toggle-vim-mode",
    name: "Toggle Vim Mode",
    actions: {
      default: {
        shortcut: "Alt+KeyV",
        async perform() {
          editorVimEnabled.value = !editorVimEnabled.value;
        },
      },
    },
    icon: VscodeIconsFileTypeVim,
  },
];
