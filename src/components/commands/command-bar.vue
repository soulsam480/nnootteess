<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";
import { computed, toRefs, watchEffect } from "vue";
import { commands, commandState, commandTree, visibleCommands } from "./state";
import { Command } from "./types";
import { createKeybindingsHandler } from "tinykeys";

const { open: commandOpen, activeIndex, search } = toRefs(
  commandState,
);

function handleClose() {
  activeIndex.value = 0;
  commandOpen.value = false;
  search.value = "";
}

function handleInput() {
  activeIndex.value = 0;
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

async function execute(command: Command) {
  const hasChildren = commandTree.value[command.id] !== undefined;

  if (hasChildren) {
    commandState.active = command.id;
  } else {
    const perform = command.actions?.default.perform;
    await perform?.(command);
    handleClose();
  }
}

onKeyStroke((e) => (e.metaKey || e.ctrlKey) && e.key === "k", () => {
  commandOpen.value = !commandOpen.value;
});

onKeyStroke("Escape", () => {
  commandOpen.value = false;
});

onKeyStroke("ArrowUp", (e) => {
  if (!commandOpen.value) {
    return;
  }

  e.preventDefault();

  activeIndex.value = Math.max(0, activeIndex.value - 1);

  syncScroll();
});

onKeyStroke("ArrowDown", (e) => {
  if (!commandOpen.value) {
    return;
  }

  e.preventDefault();

  activeIndex.value = Math.min(
    visibleCommands.value.length - 1,
    activeIndex.value + 1,
  );

  syncScroll();
});

onKeyStroke("Enter", () => {
  if (!commandOpen.value) {
    return;
  }

  const command = visibleCommands.value[activeIndex.value];

  if (!command) return;

  execute(command);
});

watchEffect(() => {
  const el = document.querySelector<HTMLDialogElement>("#commandBarDialog");

  if (commandOpen.value) {
    el?.showModal();
  } else {
    el?.close();
  }
});

const handlers = computed<Record<string, () => Promise<void>>>(() => {
  return commands.value.reduce((acc, curr) => {
    if (curr.parent || !curr.actions) {
      return acc;
    }

    return {
      ...acc,
      ...Object.fromEntries(
        Object.values(curr.actions).filter((it) => it.shortcut !== undefined)
          .map<[string, () => Promise<void>]>((
            it,
          ) => [it.shortcut as string, async () => {
            await it.perform(curr);
          }]),
      ),
    };
  }, {});
});

onKeyStroke((event) => {
  const handler = createKeybindingsHandler(handlers.value);

  handler(event);
});
</script>

<template>
  <dialog
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
          placeholder="Search..."
          v-model="search"
          @input="handleInput"
          autofocus
        />
      </div>

      <div class="results">
        <div
          v-for="(command, index) in visibleCommands"
          :key="command.id"
          class="result"
          :data-active="activeIndex === index"
          @click="execute(command)"
        >
          <span v-if="command.icon">
            <component :is="command.icon" />
          </span>
          <span class="mdst-truncate">
            {{ command.name }}
          </span>

          <span class="mdst-code" v-if="command.actions?.default.shortcut">
            {{ command.actions?.default.shortcut.replaceAll(/\+|Key/g, " ") }}
          </span>
        </div>
      </div>
    </div>
  </dialog>
</template>
