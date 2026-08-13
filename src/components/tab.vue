<script setup lang="ts">
import * as notesAPI from "@/storage/notes";
import Editor from "./editor.vue";
import { onMounted, ref } from "vue";
import { watchDebounced } from "@vueuse/core";
import MonacoEditor from "./monaco-editor.vue";
import { titleCase } from "scule";
import { removeOpenNote } from "@/storage/state";

const props = defineProps<{
  id: string;
}>();

const areDepsLoading = ref(false);

const note = await notesAPI.useNote(props.id, removeOpenNote);

const content = ref(note.value?.value.content ?? "");

async function save() {
  if (!note.value) return;

  await notesAPI.update(note.value.id, {
    ...note.value.value,
    content: content.value,
  });
}

async function loadDeps() {
  const [shiki, formatter] = await Promise.all([
    import("@/utils/shiki"),
    import("@/utils/prettier"),
  ]);

  await Promise.all([
    shiki.registerHighlighter(),
    formatter.registerFormatter(),
  ]);
}

if (note.value?.value.type === "code") {
  areDepsLoading.value = true;

  loadDeps().finally(() => {
    areDepsLoading.value = false;
  });
}

onMounted(() => {
  let title = document.head.querySelector("title");

  if (!title) {
    title = document.createElement("title");

    document.head.appendChild(title);
  }

  title.innerText = note.value?.value.name ?? "NNOOTTEESS";
});

watchDebounced(
  content,
  () => {
    save();
  },
  { debounce: 1000 },
);
</script>

<template>
  <div
    class="editor-area mdst-tabs-panel"
    role="tabpanel"
    data-state="active"
    :data-note-type="note?.value.type"
  >
    <template
      v-if="note"
    >
      <div class="editor-header">
        <input
          type="text"
          class="mdst-input"
          placeholder="Please enter a name fo the note"
          v-model="note.value.name"
          @keyup.enter="save()"
        />

        <select
          v-if='note.value.type === "code"'
          class="mdst-dropdown"
          v-model="note.value.language"
        >
          <option v-for="language in notesAPI.LANGUAGES" :value="language">
            {{ titleCase(language) }}
          </option>
        </select>
      </div>

      <Editor
        v-if='note.value.type === "note"'
        v-model="content"
      />

      <MonacoEditor
        v-else-if='note.value.type === "code" && !areDepsLoading'
        theme="nord"
        v-model="content"
        :language="note.value.language"
        :filename="notesAPI.noteToFileName(note.value)"
      />

      <div v-if="areDepsLoading">
        <span class="mdst-spinner" role="status" aria-label="Loading"></span>
        Loading editor dependencies...
      </div>
    </template>

    <div v-else>
      Note is not found!!
    </div>
  </div>
</template>
