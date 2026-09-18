<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";
import { computed, toRefs, watchEffect } from "vue";
import { commands, commandState, visibleCommands } from "./state";
import { Commandable } from "./types";
import { createKeybindingsHandler } from "tinykeys";
import { default as Keyboard } from "../kbd.vue";

const { open: commandOpen, activeIndex, search } = toRefs(
  commandState,
);

function setActive(active: string | null) {
  commandState.active = active;
  commandState.activeIndex = 0;
  search.value = "";
}

function handleClose() {
  commandOpen.value = false;
  setActive(null);
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

async function execute(command: Commandable) {
  const hasChildren = command.children.length > 0;

  if (hasChildren) {
    setActive(command.id);
  } else {
    const perform = command.actions?.default.perform;
    await perform?.(command);
    handleClose();
  }
}

function openCommandCenter() {
  commandOpen.value = true;
}

onKeyStroke((e) => (e.metaKey || e.ctrlKey) && e.key === "k", () => {
  commandOpen.value = !commandOpen.value;
});

onKeyStroke("Escape", () => {
  commandOpen.value = false;
});

onKeyStroke("Backspace", () => {
  if (!search.value && commandState.active) {
    commandState.active = null;
  }
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

              openCommandCenter();
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

          <div class="result__shortcut">
            <Keyboard
              v-if="command.actions?.default.shortcut"
              :kbd="command.actions?.default.shortcut"
            />
          </div>
        </div>
      </div>
    </div>
  </dialog>
</template>
