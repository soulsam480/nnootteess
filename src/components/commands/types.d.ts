import { FunctionalComponent, SVGAttributes } from "vue";

type Execute = {
  shortcut?: string;
  perform: (self: Command) => Promise<void>;
};

export interface Command {
  id: string;
  name: string;
  parent?: string;
  actions?: {
    default: Execute;
    [x: string]: Execute;
  };

  icon?: FunctionalComponent<SVGAttributes, {}, any, {}>;
}

export interface CommandState {
  open: boolean;
  search: string;
  active: string | null;
  activeIndex: number;
}
