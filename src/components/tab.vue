<script setup lang="ts">
import * as notesAPI from "@/storage/notes";
import TextEditor from "./text-editor.vue";
import { ref, unref } from "vue";
import { watchDebounced } from "@vueuse/core";
import CodeEditor from "./code-editor.vue";
import { titleCase } from "scule";
import { closeNote, lastFocused } from "@/storage/tabGroups";

const props = defineProps<{
  id: string;
  tabId: string;
}>();

const note = await notesAPI.useNote(props.id, closeNote);

const content = ref(note.value?.value.content ?? "");

async function save() {
  const inner = unref(note);
  const cont = unref(content);

  if (!inner) return;

  await notesAPI.update(
    inner.id,
    {
      ...inner.value,
      content: cont,
      sec: {
        content: cont,
      },
    },
  );
}

watchDebounced(
  content,
  (newVal, oldVal) => {
    if (newVal === oldVal) return;

    save();
  },
  { debounce: 1000 },
);

function handleFocus() {
  lastFocused.value = props.tabId;

  let title = document.head.querySelector("title");

  if (!title) {
    title = document.createElement("title");

    document.head.appendChild(title);
  }

  title.innerText = note.value?.value.name ?? "NNOOTTEESS";
}
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
          @blur="save()"
        />

        <div
          class="code-actions"
          v-if='note.value.type === "code"'
        >
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
      </div>

      <TextEditor
        v-if='note.value.type === "note"'
        v-model="content"
        @focus="handleFocus"
      />

      <CodeEditor
        @focus="handleFocus"
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
