import { SYSTEM_COMMANDS } from "@/components/commands/system";
import {
  Commandable,
  CommandConfig,
  CommandIndex,
  CommandState,
  CommandStore,
} from "@/components/commands/types";
import { computed, shallowReactive, shallowRef } from "vue";

export const PRIORITY = {
  high: 0,
  regular: 1,
  low: 2,
};

export const commandState = shallowReactive<CommandState>({
  open: false,
  active: null,
  search: "",
  activeIndex: 0,
});

export const commands = shallowRef<CommandStore>(addManyCommands(SYSTEM_COMMANDS, [], {}));

export const visibleCommands = computed(() => {
  const isTermEmpty = !Boolean(commandState.search);

  const [state, index] = commands.value;

  if (commandState.active) {
    const command = index[commandState.active];

    return sortCommands(
      command.children.filter((it) => isTermEmpty || doesMatchTerm(commandState.search, it.name)),
    );
  }

  return sortCommands(
    state.filter((commandable) => {
      return (
        commandable.parent === null &&
        (isTermEmpty || doesMatchTerm(commandState.search, commandable.name))
      );
    }),
  );
});

/**
 * Calling this inside WatchEffect will do infinite loop
 */
export function useCommands() {
  function register(commandParams: CommandConfig[]) {
    const [state, index] = addManyCommands(commandParams, ...commands.value);

    const added = state.slice(-1, commandParams.length);

    commands.value = [state, index];

    return added;
  }

  function unregister(commandParams: CommandConfig[]) {
    commands.value = removeManyCommands(commandParams, ...commands.value);
  }

  return { register, unregister };
}

//////////// --- PRIVATE API ---- ///////////////

function addManyCommands(
  commands: CommandConfig[],
  state: Commandable[],
  index: CommandIndex,
): [Commandable[], CommandIndex] {
  return commands.reduce(
    (acc, curr) => {
      const [doneState, _, doneIndex] = addCommand(curr, ...acc);

      return [doneState, doneIndex];
    },
    [state, index],
  );
}

function addCommand(
  command: CommandConfig,
  state: Commandable[],
  index: CommandIndex,
): [Commandable[], Commandable, CommandIndex] {
  if (index[command.id]) {
    const commandIndex = state.findIndex((it) => it.id === command.id);

    state[commandIndex].name = command.name;
    index[command.id].name = command.name;

    return [state, index[command.id], index];
  }

  const { parent, ...rest } = command;

  if (parent && !index[parent]) {
    throw new Error(`Command ${command.id} has a parent of ${command.parent} which does not exist`);
  }

  const commandable: Commandable = {
    children: [],
    ...rest,
    parent: null,
  };

  if (parent) {
    commandable.parent = index[parent];
    index[parent].children.push(commandable);
  }

  index[command.id] = commandable;

  return [[...state, commandable], commandable, index];
}

function removeCommand(
  command: CommandConfig,
  state: Commandable[],
  index: CommandIndex,
): CommandStore {
  const commandable = index[command.id];

  if (!commandable) {
    return [state, index];
  }

  delete index[command.id];

  const childIds = new Set([...commandable.children.map((it) => it.id)]);

  state = state.filter((it) => {
    const isChild = childIds.has(it.id);

    if (isChild && index[it.id]) {
      delete index[it.id];
    }

    return !(it.id === commandable.id || childIds.has(it.id));
  });

  return [state, index];
}

function removeManyCommands(
  commands: CommandConfig[],
  state: Commandable[],
  index: CommandIndex,
): CommandStore {
  return commands.reduce(
    (acc, curr) => {
      const [doneState, doneIndex] = removeCommand(curr, ...acc);

      return [doneState, doneIndex];
    },
    [state, index],
  );
}

function doesMatchTerm(term: string, name: string): boolean {
  return name.toLowerCase().includes(term.toLowerCase());
}

function sortCommands(commands: Commandable[]): Commandable[] {
  return commands.sort((a, b) => {
    const aScore = a.priority ?? PRIORITY.low;
    const bScore = b.priority ?? PRIORITY.low;

    return aScore - bScore;
  });
}
