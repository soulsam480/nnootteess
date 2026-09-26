<script type="module" lang="ts">
export const editorReadonlyEnabled = useStorage("readonly_mode", false);
</script>

<script setup lang="ts">
import { AtomicCodeMirrorEditor } from "@atomic-editor/editor";
import "@atomic-editor/editor/styles.css";
import { LanguageDescription } from "@codemirror/language";
import { useStorage } from "@vueuse/core";
import { markRaw } from "vue";
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
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "focus"): void;
}>();

const state = props.modelValue;

const extensions = markRaw([
  keymap.of([
    ...searchKeymap,
  ]),
]);
</script>

<template>
  <AtomicCodeMirrorEditor
    ref="handle"
    :markdownSource="state"
    :readOnly="editorReadonlyEnabled"
    @markdownChange='$emit("update:modelValue", $event)'
    :codeLanguages="LANG_DESCRIPTORS"
    :extensions="extensions"
  />
</template>
