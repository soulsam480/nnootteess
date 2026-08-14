<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { EditorState, type Extension, StateEffect } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { lineNumbers } from "@codemirror/view";

import {
  getLanguageExtension,
  nordHighlighting,
  nordTheme,
} from "@/utils/codemirror";
import { formatCode } from "@/utils/prettier";

const props = defineProps<{
  modelValue: string;
  language: string;
  theme?: string;
}>();

const emit = defineEmits<{
  editorWillMount: [];
  editorDidMount: [instance: EditorView];
  change: [value: string];
  "update:modelValue": [value: string];
}>();

const container = ref<HTMLElement | null>(null);

let instance: EditorView | undefined;

let updatingFromProp = false;

function getPositionAt(offset: number) {
  if (!instance) {
    return null;
  }

  const line = instance.state.doc.lineAt(
    Math.max(0, Math.min(offset, instance.state.doc.length)),
  );

  return {
    lineNumber: line.number,
    column: offset - line.from + 1,
  };
}

function formatDocument(view: EditorView): boolean {
  void formatDocumentAsync(view);
  return true;
}

async function formatDocumentAsync(view: EditorView): Promise<void> {
  const { language } = props;

  if (
    language !== "json" &&
    language !== "javascript" &&
    language !== "typescript"
  ) {
    return;
  }
  const value = view.state.doc.toString();

  try {
    const formatted = await formatCode(value, language);

    if (formatted === value) {
      return;
    }

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: formatted,
      },
    });
  } catch (error) {
    console.log(error);
    // Invalid JSON — leave the document untouched.
  }
}

function buildExtensions(): Extension[] {
  const extensions: Extension[] = [
    getLanguageExtension(props.language),

    nordTheme,
    nordHighlighting,

    history(),

    bracketMatching(),

    closeBrackets(),

    indentOnInput(),

    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
      indentWithTab,
      {
        key: "Mod-Shift-f",
        run: formatDocument,
      },
    ]),

    EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }

      const value = update.state.doc.toString();

      emit("change", value);

      if (!updatingFromProp) {
        emit("update:modelValue", value);
      }
    }),

    EditorView.theme({
      "&": {
        fontSize: `14px`,
        fontFamily:
          'ui-monospace, Menlo, Monaco, "Cascadia Code", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace',
      },
    }),
  ];

  extensions.push(lineNumbers());
  extensions.push(EditorView.lineWrapping);

  return extensions;
}

function createEditor() {
  if (!container.value) {
    return;
  }

  emit("editorWillMount");

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: buildExtensions(),
  });

  instance = new EditorView({
    state,
    parent: container.value,
  });

  emit("editorDidMount", instance);
}

function replaceDocument(value: string) {
  if (!instance) {
    return;
  }

  const current = instance.state.doc.toString();

  if (current === value) {
    return;
  }

  updatingFromProp = true;

  instance.dispatch({
    changes: {
      from: 0,
      to: instance.state.doc.length,
      insert: value,
    },
  });

  updatingFromProp = false;
}

function reconfigureLanguage() {
  if (!instance) {
    return;
  }

  const language = getLanguageExtension(props.language);

  instance.dispatch({
    effects: StateEffect.appendConfig.of([
      language,
    ]),
  });
}

watch(
  () => props.modelValue,
  (value) => {
    replaceDocument(value);
  },
);

watch(
  () => props.language,
  () => {
    reconfigureLanguage();
  },
);

onMounted(() => {
  createEditor();
});

onBeforeUnmount(() => {
  instance?.destroy();
  instance = undefined;
});

defineExpose({
  getPositionAt,

  getView() {
    return instance;
  },

  focus() {
    instance?.focus();
  },
});
</script>

<template>
  <div
    ref="container"
    class="code-editor-wrapper"
  />
</template>

<style>
.code-editor-wrapper .cm-editor {
  width: 100%;
  height: 100%;
}

.code-editor-wrapper .cm-scroller {
  overflow: auto;
}
</style>
