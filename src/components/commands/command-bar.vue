<script tupe="module" lang="ts">
import { commands, commandState, visibleCommands } from "./state";

function getDefaultIndex() {
  return typeof visibleCommands.value[0] === "string" ? 1 : 0;
}

export function triggerCommandBar(op: "open" | "close") {
  const el = document.querySelector<HTMLDialogElement>("#commandBarDialog");

  if (op === "open") {
    el?.showModal();
    commandState.activeIndex = getDefaultIndex();
  } else {
    el?.close();
  }
}

export function toggleCommandBar() {
  const el = document.querySelector<HTMLDialogElement>("#commandBarDialog");

  if (el?.open) {
    triggerCommandBar("close");
  } else {
    triggerCommandBar("open");
  }
}
</script>

<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";
import { computed, nextTick, toRefs, useTemplateRef } from "vue";
import { Commandable } from "./types";
import { createKeybindingsHandler } from "tinykeys";
import { default as Keyboard } from "../kbd.vue";

const { activeIndex, search } = toRefs(
  commandState,
);

const commandBarDialog = useTemplateRef<HTMLDialogElement>("commandBarDialog");

function setActive(active: string | null) {
  commandState.active = active;
  search.value = "";

  nextTick().then(() => {
    commandState.activeIndex = getDefaultIndex();
  });
}

function handleClose() {
  setActive(null);
}

function handleInput() {
  activeIndex.value = getDefaultIndex();
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

async function execute(command: Commandable) {
  const hasChildren = command.children.length > 0;

  if (hasChildren) {
    setActive(command.id);
  } else {
    const perform = command.actions?.default.perform;
    await perform?.(command);
    triggerCommandBar("close");
  }
}

onKeyStroke((e) => (e.metaKey || e.ctrlKey) && e.key === "k", toggleCommandBar);

onKeyStroke("Escape", () => {
  triggerCommandBar("close");
});

onKeyStroke("Backspace", () => {
  if (!search.value && commandState.active) {
    commandState.active = null;
    activeIndex.value = getDefaultIndex();
  }
});

onKeyStroke("ArrowUp", (e) => {
  if (!commandBarDialog.value?.open) {
    return;
  }

  e.preventDefault();

  const prevIndex = activeIndex.value - 1;

  const prev = visibleCommands.value[prevIndex];

  if (typeof prev === "string" && prevIndex === 0) {
    activeIndex.value = visibleCommands.value.length - 1;
  } else if (typeof prev === "string") {
    activeIndex.value = prevIndex - 1;
  } else {
    activeIndex.value = prevIndex;
  }

  syncScroll();
});

onKeyStroke("ArrowDown", (e) => {
  if (!commandBarDialog.value?.open) {
    return;
  }

  e.preventDefault();

  const maxIndex = visibleCommands.value.length - 1;
  let nextIndex = activeIndex.value + 1;

  if (nextIndex > maxIndex) {
    nextIndex = 0;
  }

  activeIndex.value = typeof visibleCommands.value[nextIndex] === "string"
    ? nextIndex + 1
    : nextIndex;

  syncScroll();
});

onKeyStroke("Enter", () => {
  if (!commandBarDialog.value?.open) {
    return;
  }

  const command = visibleCommands.value[activeIndex.value];

  if (!command || typeof command === "string") return;

  execute(command);
});

const handlers = computed<Record<string, () => Promise<void>>>(() => {
  return commands.value[0].reduce((acc, curr) => {
    if (curr.parent || !curr.actions) {
      return acc;
    }

    return {
      ...acc,
      ...Object.fromEntries(
        Object.values(curr.actions).filter((it) => it.shortcut !== undefined)
          .map<[string, (event: Event) => Promise<void>]>((
            it,
          ) => [it.shortcut as string, async (event) => {
            if (it.perform) {
              await it.perform(curr);
            } else {
              event.preventDefault();
              event.stopPropagation();

              triggerCommandBar("open");
              setActive(curr.id);
            }
          }]),
      ),
    };
  }, {});
});

onKeyStroke((event) => {
  const handler = createKeybindingsHandler(handlers.value);

  handler(event);
});

const activeParent = computed(() => {
  if (!commandState.active) {
    return null;
  }

  return commands.value[1][commandState.active];
});
</script>

<template>
  <dialog
    ref="commandBarDialog"
    id="commandBarDialog"
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
          :placeholder='activeParent?.placeholder ?? "Search..."'
          v-model="search"
          @input="handleInput"
          autofocus
        />
      </div>

      <div class="results">
        <template
          v-for="(command, index) in visibleCommands"
          :key='typeof command === "string" ? command : command.id'
        >
          <div
            v-if='typeof command !== "string"'
            class="result"
            :data-active="activeIndex === index"
            @click="execute(command)"
          >
            <span v-if="command.icon">
              <component :is="command.icon" />
            </span>
            <span class="mdst-truncate">
              <template v-if='typeof command.name === "function"'>
                <component :is="command.name" />
              </template>
              <template v-else>
                {{ command.name }}
              </template>
            </span>

            <div class="result__shortcut">
              <Keyboard
                v-if="command.actions?.default.shortcut"
                :kbd="command.actions?.default.shortcut"
              />
            </div>
          </div>
          <div class="result result--group" v-else>
            {{ command }}
          </div>
        </template>
      </div>
    </div>
  </dialog>
</template>
