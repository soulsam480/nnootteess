<script type="module" lang="ts">
export const editorReadonlyEnabled = useStorage("readonly_mode", false);
</script>

<script setup lang="ts">
import {
  AtomicCodeMirrorEditor,
  mermaidBlocks,
  useAtomicEditorHandle,
} from "@atomic-editor/editor";
import "@atomic-editor/editor/styles.css";
import { LanguageDescription } from "@codemirror/language";
import { EditorSelection, Transaction } from "@codemirror/state";
import { useStorage } from "@vueuse/core";
import { markRaw, watch } from "vue";
import { keymap } from "@codemirror/view";
import { searchKeymap } from "@codemirror/search";

const LANG_DESCRIPTORS: LanguageDescription[] = [
  LanguageDescription.of({
    name: "JavaScript",
    alias: ["js", "jsx"],
    extensions: ["js", "mjs", "cjs", "jsx"],
    load: () =>
      import("@codemirror/lang-javascript").then((m) =>
        m.javascript({ jsx: true })
      ),
  }),
  LanguageDescription.of({
    name: "TypeScript",
    alias: ["ts", "tsx"],
    extensions: ["ts", "mts", "cts", "tsx"],
    load: () =>
      import("@codemirror/lang-javascript").then((m) =>
        m.javascript({ typescript: true, jsx: true })
      ),
  }),
  LanguageDescription.of({
    name: "JSON",
    extensions: ["json"],
    load: () => import("@codemirror/lang-json").then((m) => m.json()),
  }),
  LanguageDescription.of({
    name: "CSS",
    extensions: ["css"],
    load: () => import("@codemirror/lang-css").then((m) => m.css()),
  }),
  LanguageDescription.of({
    name: "HTML",
    alias: ["htm"],
    extensions: ["html", "htm"],
    load: () => import("@codemirror/lang-html").then((m) => m.html()),
  }),
  LanguageDescription.of({
    name: "Markdown",
    alias: ["md"],
    extensions: ["md", "markdown", "mkd"],
    load: () => import("@codemirror/lang-markdown").then((m) => m.markdown()),
  }),
];

const props = defineProps<{
  modelValue: string;
  noteId: string;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "focus"): void;
}>();

const state = props.modelValue;
const { handle } = useAtomicEditorHandle();

watch(
  () => props.modelValue,
  (incoming) => {
    const view = handle.value?.view;
    if (!view || incoming === view.state.doc.toString()) return;

    const { anchor, head } = view.state.selection.main;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: incoming },
      selection: EditorSelection.range(
        Math.min(anchor, incoming.length),
        Math.min(head, incoming.length),
      ),
      annotations: Transaction.addToHistory.of(false),
    });
  },
);

const extensions = markRaw([
  keymap.of([
    ...searchKeymap,
  ]),
  mermaidBlocks(),
]);

defineExpose({
  getView: () => handle.value?.view ?? null,
});
</script>

<template>
  <AtomicCodeMirrorEditor
    ref="handle"
    :markdownSource="state"
    :documentId="noteId"
    :readOnly="editorReadonlyEnabled"
    @markdownChange='$emit("update:modelValue", $event)'
    @focusin="$emit('focus')"
    :codeLanguages="LANG_DESCRIPTORS"
    :extensions="extensions"
  />
</template>
