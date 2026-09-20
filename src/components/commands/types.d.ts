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
  /**
   * Can be a string pr a function producing a string
   * The function has to be pure or only read refs inside
   */
  name: string | (() => string);
  parent?: string;
  actions?: {
    default: Execute;
    [x: string]: Execute;
  };
  icon?: FunctionalComponent<SVGAttributes, {}, any, {}>;
  placeholder?: string;
  priority?: number;
  group?: string;
}

export interface CommandState {
  search: string;
  active: string | null;
  activeIndex: number;
}
