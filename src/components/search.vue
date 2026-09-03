<script setup lang="ts">
import { CodeNote, notes } from "@/storage/notes";
import { LANG_TO_COLOR } from "@/utils/codemirror";
import { onKeyStroke } from "@vueuse/core";
import { computed, shallowRef, watchEffect } from "vue";
import CarbonDocument from "~icons/carbon/document";
import CarbonCode from "~icons/carbon/code";
import { openNote } from "@/storage/tabGroups";

const searchOpen = shallowRef(false);
const currentIndex = shallowRef(0);
const term = shallowRef("");

const found = computed(() => {
  const { notes: inner } = notes.value;

  return inner.filter((it) => {
    const { value: { name } } = it;

    return name.toLowerCase().includes(term.value.toLowerCase());
  });
});

function handleClose() {
  currentIndex.value = 0;
  searchOpen.value = false;
  term.value = "";
}

function handleInput() {
  currentIndex.value = 0;
}

function syncScroll() {
  window.requestAnimationFrame(() => {
    document.querySelector(".result[data-active=true]")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "start",
    });
  });
}

function handleOpen(noteId: string) {
  openNote(noteId);
  handleClose();
}

onKeyStroke((e) => (e.metaKey || e.ctrlKey) && e.key === "k", () => {
  searchOpen.value = !searchOpen.value;
});

onKeyStroke("Escape", () => {
  searchOpen.value = false;
});

onKeyStroke("ArrowUp", (e) => {
  if (!searchOpen.value) {
    return;
  }

  e.preventDefault();

  currentIndex.value = Math.max(0, currentIndex.value - 1);

  syncScroll();
});

onKeyStroke("ArrowDown", (e) => {
  if (!searchOpen.value) {
    return;
  }

  e.preventDefault();

  currentIndex.value = Math.min(found.value.length - 1, currentIndex.value + 1);

  syncScroll();
});

onKeyStroke("Enter", () => {
  if (!searchOpen.value) {
    return;
  }

  const note = notes.value.notes[currentIndex.value];
  handleOpen(note.id);
});

watchEffect(() => {
  const el = document.querySelector<HTMLDialogElement>("#searchModal");

  if (searchOpen.value) {
    el?.showModal();
  } else {
    el?.close();
  }
});
</script>

<template>
  <dialog
    id="searchModal"
    class="mdst-dialog search-dialog"
    @close="handleClose"
  >
    <div class="mdst-dialog-body">
      <div class="search-dialog__input">
        <input
          tabindex="0"
          ref="searchInput"
          type="text"
          class="mdst-input"
          name="search"
          placeholder="Search for notes..."
          v-model="term"
          @input="handleInput"
          autofocus
        />
      </div>

      <div class="results">
        <div
          v-for="(note, index) in found"
          :key="note.id"
          class="result"
          :data-active="currentIndex === index"
          @click="handleOpen(note.id)"
        >
          <span
            :style="{
              color: LANG_TO_COLOR[(note.value as CodeNote).language] ??
                LANG_TO_COLOR.md,
            }"
          >
            <CarbonDocument v-if='note.value.type === "note"' />
            <CarbonCode
              v-else-if='note.value.type === "code"'
            />
          </span>
          <span class="mdst-truncate">
            {{ note.value.name }}
          </span>
        </div>
      </div>
    </div>
  </dialog>
</template>
