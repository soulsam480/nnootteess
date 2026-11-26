<script setup lang="ts">
import * as notesAPI from "@/storage/notes";
import { computed, defineAsyncComponent, ref, unref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import { EditorView } from "@codemirror/view";
import { titleCase } from "scule";
import CarbonListTree from "~icons/carbon/list-tree";
import { closeNote, lastFocusedTab } from "@/storage/tabGroups";
import { extractHeadings } from "@/utils/outline";
import OutlinePopover from "./outline-popover.vue";
import { closeOutline, outlineState, toggleOutline } from "./outline-state";

const TextEditor = defineAsyncComponent(async () => await import("@/components/text-editor.vue"));

const CodeEditor = defineAsyncComponent(async () => await import("@/components/code-editor.vue"));

const props = defineProps<{
  id: string;
  tabId: number;
}>();

const { note, error } = await notesAPI.useNote(props.id, closeNote);

const content = ref(note.value?.value.content ?? "");
let lastSavedContent = content.value;

async function save() {
  const inner = unref(note);
  const cont = unref(content);

  if (!inner || error.value) return;

  const saved = await notesAPI.update(inner.id, {
    ...inner.value,
    content: cont,
    sec: {
      content: cont,
    },
  });

  lastSavedContent = cont;

  if (unref(content) === cont && typeof saved.value?.content === "string") {
    content.value = saved.value.content;
    lastSavedContent = saved.value.content;
  }
}

watch(note, (incoming) => {
  const incomingContent = incoming?.value.content;

  if (typeof incomingContent !== "string") return;
  if (unref(content) !== lastSavedContent) return;
  if (incomingContent === unref(content)) return;

  content.value = incomingContent;
  lastSavedContent = incomingContent;
});

watchDebounced(
  content,
  (newVal, oldVal) => {
    if (newVal === oldVal) return;

    save();
  },
  { debounce: 1000 },
);

const editor = ref<{ getView(): EditorView | null } | null>(null);

const headings = computed(() => extractHeadings(content.value));

function getView(): EditorView | null {
  return editor.value?.getView() ?? null;
}

function jumpTo(line: number) {
  const view = getView();

  if (!view) return;

  outlineState.activeLine = line;

  const target = view.state.doc.line(Math.max(1, Math.min(line, view.state.doc.lines)));

  view.dispatch({
    selection: { anchor: target.from },
    effects: EditorView.scrollIntoView(target.from, { y: "start" }),
    scrollIntoView: true,
  });
  view.focus();
}

function handleFocus() {
  lastFocusedTab.value = props.tabId;
  notesAPI.lastFocusedNote.value = props.id;
}

watch(
  () => props.id,
  () => closeOutline(props.tabId),
);
</script>

<template>
  <div
    class="editor-area mdst-tabs-panel"
    role="tabpanel"
    data-state="active"
    :data-note-type="note?.value.type"
  >
    <div v-if="error" class="mdst-p mdst-p--sm" role="alert">
      {{ error.message }}
    </div>

    <template v-if="note && !error">
      <div class="editor-header">
        <input
          type="text"
          class="mdst-input"
          placeholder="Please enter a name fo the note"
          v-model="note.value.name"
          @keyup.enter="save()"
          @blur="save()"
        />

        <div class="code-actions" v-if="note.value.type === 'code'">
          <select
            class="mdst-dropdown"
            v-model="note.value.language"
            @change="save()"
            style="min-width: 105px"
          >
            <option v-for="language in notesAPI.LANGUAGES" :value="language">
              {{ titleCase(language) }}
            </option>
          </select>
        </div>

        <template v-if="note.value.type === 'note'">
          <button
            type="button"
            class="mdst-button mdst-button--sm mdst-button--ghost outline-toggle"
            :id="`outline-toggle-${props.tabId}`"
            :data-outline-toggle="props.tabId"
            data-tooltip="Outline (Alt+I)"
            aria-label="Outline"
            aria-haspopup="dialog"
            aria-controls="outline-popover"
            :aria-expanded="outlineState.openTabId === props.tabId"
            @click="toggleOutline(props.tabId)"
          >
            <CarbonListTree />
          </button>

          <OutlinePopover
            v-if="outlineState.openTabId === props.tabId"
            :headings="headings"
            :tab-id="props.tabId"
            :get-view="getView"
            @jump="jumpTo"
          />
        </template>
      </div>

      <TextEditor
        v-if="note.value.type === 'note'"
        ref="editor"
        v-model="content"
        :note-id="id"
        @focus="handleFocus"
      />

      <CodeEditor
        @focus="handleFocus"
        v-else-if="note.value.type === 'code'"
        theme="nord"
        v-model="content"
        :language="note.value.language"
      />
    </template>

    <div v-else-if="!error">Note is not found!!</div>
  </div>
</template>
