<script setup lang="ts">
import type { EditorView } from "@codemirror/view";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import type { Heading } from "@/utils/outline";
import { closeOutline, outlineState } from "./outline-state";

const props = defineProps<{
  headings: Heading[];
  tabId: number;
  getView: () => EditorView | null;
}>();

const emit = defineEmits<{
  jump: [line: number];
}>();

const popover = useTemplateRef<HTMLElement>("popover");
const filterInput = useTemplateRef<HTMLInputElement>("filterInput");
const activeIndex = ref(0);

const visible = computed(() => {
  const term = outlineState.filter.trim().toLowerCase();

  if (!term) return props.headings;

  return props.headings.filter((heading) => heading.text.toLowerCase().includes(term));
});

watch(
  () => outlineState.filter,
  () => {
    activeIndex.value = 0;
  },
);

function activate(index: number) {
  const heading = visible.value[index];

  if (!heading) return;

  activeIndex.value = index;
  outlineState.activeLine = heading.line;
  emit("jump", heading.line);
}

function select(index: number) {
  const total = visible.value.length;

  if (total === 0) return;

  activeIndex.value = (index + total) % total;
}

function dismiss() {
  closeOutline(props.tabId);

  nextTick(() => {
    document.querySelector<HTMLElement>(`[data-outline-toggle="${props.tabId}"]`)?.focus();
  });
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      select(activeIndex.value + 1);
      break;
    case "ArrowUp":
      event.preventDefault();
      select(activeIndex.value - 1);
      break;
    case "Home":
      event.preventDefault();
      select(0);
      break;
    case "End":
      event.preventDefault();
      select(visible.value.length - 1);
      break;
    case "Enter":
      event.preventDefault();
      activate(activeIndex.value);
      break;
    case "Escape":
      event.preventDefault();
      dismiss();
      break;
  }
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape" || outlineState.openTabId !== props.tabId) return;

  dismiss();
}

let trackedView: EditorView | null = null;
let frame: number | null = null;
let attachFrame: number | null = null;

function lastHeadingLineAtOrBefore(line: number): number | null {
  let low = 0;
  let high = props.headings.length - 1;
  let result: number | null = null;

  while (low <= high) {
    const middle = (low + high) >> 1;
    const candidate = props.headings[middle]!;

    if (candidate.line <= line) {
      result = candidate.line;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return result;
}

function updateActive() {
  frame = null;

  if (outlineState.openTabId !== props.tabId) return;

  const view = props.getView();

  if (!view) return;

  if (view !== trackedView) {
    detach();
    attach(view);
    return;
  }

  const top = view.scrollDOM.getBoundingClientRect().top - view.documentTop + 8;
  const line = view.state.doc.lineAt(view.lineBlockAtHeight(Math.max(0, top)).from).number;
  const next = lastHeadingLineAtOrBefore(line);

  if (next !== outlineState.activeLine) outlineState.activeLine = next;
}

function onScroll() {
  if (frame !== null) return;

  frame = requestAnimationFrame(updateActive);
}

function attach(view: EditorView) {
  trackedView = view;
  view.scrollDOM.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function detach() {
  trackedView?.scrollDOM.removeEventListener("scroll", onScroll);
  trackedView = null;

  if (frame !== null) {
    cancelAnimationFrame(frame);
    frame = null;
  }
}

function ensureTracking() {
  if (outlineState.openTabId !== props.tabId) return;

  const view = props.getView();

  if (!view) {
    attachFrame = requestAnimationFrame(ensureTracking);
    return;
  }

  attachFrame = null;

  if (view !== trackedView) {
    detach();
    attach(view);
  }
}

onMounted(async () => {
  await nextTick();

  const source = document.querySelector<HTMLElement>(`[data-outline-toggle="${props.tabId}"]`) ??
    undefined;

  // @ts-expect-error DOM types omit the source anchor option
  popover.value?.showPopover({ source });
  filterInput.value?.focus();
  ensureTracking();
  document.addEventListener("keydown", onDocumentKeydown);
});

onBeforeUnmount(() => {
  detach();

  if (attachFrame !== null) cancelAnimationFrame(attachFrame);

  document.removeEventListener("keydown", onDocumentKeydown);
  closeOutline(props.tabId);
});
</script>

<template>
  <div
    id="outline-popover"
    ref="popover"
    class="mdst-popover mdst-popover--anchored mdst-popover--sm outline-popover"
    popover="manual"
    role="dialog"
    aria-label="Outline"
    @keydown="handleKeydown"
  >
    <input
      ref="filterInput"
      v-model="outlineState.filter"
      type="text"
      class="mdst-input outline-filter"
      aria-label="Filter headings"
      placeholder="Filter headings"
    />

    <ul v-if="visible.length" class="outline-list">
      <li v-for="(heading, index) in visible" :key="`${heading.line}-${heading.text}`">
        <button
          type="button"
          class="outline-row"
          :data-level="heading.level"
          :data-active="outlineState.activeLine === heading.line"
          :aria-current="outlineState.activeLine === heading.line ? 'true' : undefined"
          @mouseenter="activeIndex = index"
          @click="activate(index)"
        >
          {{ heading.text }}
        </button>
      </li>
    </ul>

    <div v-else class="outline-empty">
      <p class="mdst-p--muted">
        {{ headings.length ? "No matching headings" : "No headings in this note" }}
      </p>
      <p v-if="!headings.length" class="mdst-p--muted">Add a heading with # at the start of a line</p>
    </div>
  </div>
</template>

<style scoped></style>
