<script lang="ts" setup>
import { monaco } from "@/utils/monaco";
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  watchEffect,
} from "vue";

const props = defineProps<{
  modelValue: string;
  language: string;
  theme?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  filename: string;
}>();

const emit = defineEmits([
  "editorWillMount",
  "editorDidMount",
  "change",
  "update:modelValue",
]);

const container: any = ref(null);
let instance: monaco.editor.IStandaloneCodeEditor | undefined;
const model = shallowRef<monaco.editor.ITextModel>(initModel());

watchEffect((onCleanup) => {
  const dispose = model.value.onDidChangeContent(() => {
    const value = model.value.getValue();
    emit("update:modelValue", value);
  });
  onCleanup(() => dispose);
});

function initModel() {
  return monaco.editor.createModel(
    props.modelValue,
    props.language,
    monaco.Uri.file(props.filename),
  );
}

watch(
  () => props.language,
  () => {
    monaco.editor.setModelLanguage(model.value, props.language);
  },
);

watch(
  () => props.filename,
  () => {
    if (instance) {
      model.value.dispose();
      model.value = initModel();
      instance.setModel(model.value);
    }
  },
);

function initMonaco() {
  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize: 14,
    scrollBeyondLastLine: true,
    fixedOverflowWidgets: true,
    fontFamily:
      `ui-monospace, Menlo, Monaco, "Cascadia Code", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro","Fira Mono", "Droid Sans Mono", "Courier New", monospace`,
    ...props.options,
    theme: props.theme,
    automaticLayout: true,
    minimap: { enabled: false },
    folding: false,
    glyphMargin: false,
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 3,
    codeLens: false,
    colorDecorators: false,
    occurrencesHighlight: "off",
    selectionHighlight: false,
    links: false,
    matchBrackets: "always",
    renderValidationDecorations: "off",
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    parameterHints: { enabled: false },
    hover: { enabled: "off" },
    stickyScroll: { enabled: false },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
  };

  instance = monaco.editor.create(container.value, editorOptions);
  instance.setModel(model.value);

  emit("editorDidMount", instance);
}

onMounted(() => {
  initMonaco();
});

onBeforeUnmount(() => {
  model.value.dispose();
  instance?.dispose();
});

const getPositionAt = (offset: number) => model.value.getPositionAt(offset);

defineExpose({
  getPositionAt,
});
</script>

<template>
  <div ref="container" class="monaco-wrapper" />
</template>
