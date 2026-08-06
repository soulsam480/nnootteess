<script setup lang="ts">
import * as notesAPI from "@/storage/notes";
import Editor from "./editor.vue";
import { ref } from "vue";
import { NodeObject } from "genosdb";
import { watchDebounced } from "@vueuse/core";

const props = defineProps<{
  id: string;
}>();

const note = ref<NodeObject<notesAPI.Note>>();

try {
  note.value = await notesAPI.find(props.id);
} catch (e) {
  console.error(e);
}

async function save() {
  if (!note.value) return;

  note.value = await notesAPI.update(note.value.id, { ...note.value.value });
}

watchDebounced(
  () => note.value?.value.content,
  () => {
    save();
  },
  { debounce: 1000 },
);
</script>

<template>
  <div class="editor-area">
    <template
      v-if="note"
    >
      <input
        type="text"
        class="mdst-input"
        placeholder="Please enter a name fo the note"
        v-model="note.value.name"
        @keyup.enter="save"
      />

      <Editor
        v-model="note.value.content"
      />
    </template>

    <div v-else>
      Note is not found!!
    </div>
  </div>
</template>
