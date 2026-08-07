<script setup lang="ts">
import * as notesAPI from "@/storage/notes";
import Editor from "./editor.vue";
import { onMounted, ref } from "vue";
import { NodeObject } from "genosdb";
import { watchDebounced } from "@vueuse/core";
import { invalidateQueries } from "@/storage/query";
import { sync } from "@/storage/directory";
import { removeOpenNote } from "@/storage/state";
import MonacoEditor from "./monaco-editor.vue";
import { titleCase } from "scule";

const props = defineProps<{
  id: string;
}>();

const note = ref<NodeObject<notesAPI.Note>>();

const areDepsLoading = ref(false);

try {
  note.value = await notesAPI.find(props.id);
} catch (e) {
  removeOpenNote(props.id);
  console.error(e);
}

async function save(name = false) {
  if (!note.value) return;

  note.value = await notesAPI.update(note.value.id, { ...note.value.value });

  invalidateQueries(notesAPI.queryKeys.all());

  if (name) {
    sync(note.value, "add");
  }
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
  () => note.value?.value.content,
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
          @keyup.enter="save(true)"
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
        v-model="note.value.content"
      />

      <MonacoEditor
        v-else-if='note.value.type === "code" && !areDepsLoading'
        theme="nord"
        v-model="note.value.content"
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
