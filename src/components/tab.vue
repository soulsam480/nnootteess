<script setup lang="ts">
import * as notesAPI from "@/storage/notes";
import TextEditor from "./text-editor.vue";
import { onMounted, ref } from "vue";
import { watchDebounced } from "@vueuse/core";
import CodeEditor, { editorVimEnabled } from "./code-editor.vue";
import { titleCase } from "scule";
import { removeOpenNote } from "@/storage/state";

const props = defineProps<{
  id: string;
}>();

const note = await notesAPI.useNote(props.id, removeOpenNote);

const content = ref(note.value?.value.content ?? "");

async function save() {
  if (!note.value) return;

  await notesAPI.update(note.value.id, {
    ...note.value.value,
    content: content.value,
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
          @change="save()"
        >
          <option v-for="language in notesAPI.LANGUAGES" :value="language">
            {{ titleCase(language) }}
          </option>
        </select>

        <label class="mdst-checkbox-label">
          Vim
          <input
            v-model="editorVimEnabled"
            type="checkbox"
            class="mdst-checkbox--toggle"
          />
        </label>
      </div>

      <TextEditor
        v-if='note.value.type === "note"'
        v-model="content"
      />

      <CodeEditor
        v-else-if='note.value.type === "code"'
        theme="nord"
        v-model="content"
        :language="note.value.language"
      />
    </template>

    <div v-else>
      Note is not found!!
    </div>
  </div>
</template>
