import { SYSTEM_COMMANDS } from "@/components/commands/system";
import { Command, CommandState } from "@/components/commands/types";
import { computed, shallowReactive, shallowRef } from "vue";

export const commandState = shallowReactive<CommandState>({
  open: false,
  active: null,
  search: "",
  activeIndex: 0,
});

export const commands = shallowRef<Command[]>([...SYSTEM_COMMANDS]);

export const commandTree = computed(() => {
  const tree: Record<string, Set<string>> = {};

  for (const command of commands.value) {
    if (!command.parent) {
      continue;
    }

    if (command.parent === command.id) {
      throw new Error(`Command ${command.id} has a parent of itself`);
    }

    if (!tree[command.parent]) {
      throw new Error(`Command ${command.parent} does not exist`);
    }

    tree[command.parent] ??= new Set();

    tree[command.parent].add(command.id);
  }

  return tree;
});

export const visibleCommands = computed(() => {
  const isTermEmpty = !Boolean(commandState.search);

  return commands.value.filter((command) => {
    const isTermMatch =
      isTermEmpty || command.name.toLowerCase().includes(commandState.search.toLowerCase());

    if (commandState.active) {
      return command.parent === commandState.active && isTermMatch;
    }

    if (command.parent) {
      return false;
    }

    return isTermMatch;
  });
});
