<script setup lang="ts">
import { CodeNote, notes } from "@/storage/notes";
import { LANG_TO_COLOR } from "@/utils/codemirror";
import { onKeyStroke } from "@vueuse/core";
import { computed, shallowRef, useTemplateRef } from "vue";
import CarbonDocument from "~icons/carbon/document";
import CarbonCode from "~icons/carbon/code";

const searchOpen = shallowRef(false);
const currentIndex = shallowRef(0);
const term = shallowRef("");

const searchInput = useTemplateRef<HTMLInputElement>("searchInput");

onKeyStroke((e) => (e.metaKey || e.ctrlKey) && e.key === "k", () => {
  if (!searchOpen.value) {
    searchInput.value?.focus();
  }

  searchOpen.value = !searchOpen.value;
});

onKeyStroke("Escape", () => {
  searchOpen.value = false;
});

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

function handleChange() {
  currentIndex.value = 0;
}

function syncScroll() {
  window.requestAnimationFrame(() => {
    document.querySelector(".result[data-active=true]")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  });
}

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
});
</script>

<template>
  <dialog
    id="searchModal"
    class="mdst-dialog search-dialog"
    :open="searchOpen"
    @close="handleClose"
  >
    <div class="mdst-dialog-body">
      <input
        tabindex="0"
        ref="searchInput"
        type="text"
        class="mdst-input"
        name="search"
        placeholder="Search for notes..."
        v-model="term"
        @change="handleChange"
        autofocus
      />

      <div class="results">
        <div
          v-for="(note, index) in found"
          :key="note.id"
          class="result"
          :data-active="currentIndex === index"
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
