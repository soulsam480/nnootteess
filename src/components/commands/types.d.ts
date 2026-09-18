import { FunctionalComponent, SVGAttributes } from "vue";

type Execute = {
  shortcut?: string;
  perform?: (self: Commandable) => Promise<void>;
};

export interface Commandable extends Omit<CommandConfig, "parent"> {
  children: Commandable[];
  parent: Commandable | null;
}

export interface CommandIndex {
  [x: string]: Commandable;
}

export type CommandStore = [Commandable[], CommandIndex];

export interface CommandConfig {
  id: string;
  name: string;
  parent?: string;
  actions?: {
    default: Execute;
    [x: string]: Execute;
  };
  icon?: FunctionalComponent<SVGAttributes, {}, any, {}>;
  placeholder?: string;
  priority?: number;
}

export interface CommandState {
  open: boolean;
  search: string;
  active: string | null;
  activeIndex: number;
}
