import { DBSchema, openDB } from "idb";

export interface ITabGroup {
  id?: number;
  owner: string;
  active: string;
  created_at: number;
  notes: string[];
}

interface Notesx2Db extends DBSchema {
  tab_groups: {
    value: ITabGroup;
    key: number;
    indexes: {
      tab_group_on_owner: string;
    };
  };
}

export const indexedDb = await openDB<Notesx2Db>("notesx2", 1, {
  upgrade(db) {
    const store = db.createObjectStore("tab_groups", {
      keyPath: "id",
      autoIncrement: true,
    });

    store.createIndex("tab_group_on_owner", "owner");
  },
});
