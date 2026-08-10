import { InjectionKey } from "vue";

class LocalStorage {
  constructor(readonly env: "web" | "chrome") {}

  async get<T>(key: string): Promise<T | null> {
    switch (this.env) {
      case "web": {
        const val = sessionStorage.getItem(key);

        if (val) {
          return JSON.parse(val);
        }

        return null;
      }

      case "chrome": {
        const val = await chrome.storage.local.get(key);

        if (val[key]) {
          return val[key] as T;
        }

        return null;
      }
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    switch (this.env) {
      case "web": {
        sessionStorage.setItem(key, JSON.stringify(value));
        break;
      }

      case "chrome": {
        chrome.storage.local.set({ [key]: value });
        break;
      }
    }
  }

  async remove(key: string) {
    switch (this.env) {
      case "web": {
        sessionStorage.removeItem(key);
        break;
      }

      case "chrome": {
        await chrome.storage.local.remove(key);
        break;
      }
    }
  }
}

export const storageKey = Symbol("storage") as InjectionKey<LocalStorage>;

export { LocalStorage };
