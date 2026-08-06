import { sm } from "@/storage/db";
import { reactive } from "vue";

export interface User {
  id: string | null;
  state: "authenticated" | "inactive";
}

const user = reactive<User>({
  id: null,
  state: "inactive",
});

async function login(previousMemonic?: string) {
  const identity: Record<string, string> | null = previousMemonic
    ? await sm().loginOrRecoverUserWithMnemonic(previousMemonic)
    : await sm().startNewUserRegistration();

  if (!identity) {
    return;
  }

  const { address, mnemonic } = identity;

  if (!previousMemonic) {
    await sm().loginOrRecoverUserWithMnemonic(mnemonic);
  }

  await persistMnemonicUnsafe(mnemonic);

  return { address, mnemonic };
}

sm().setSecurityStateChangeCallback((state) => {
  if (state.isActive && state.activeAddress) {
    user.id = state.activeAddress;
    user.state = "authenticated";
  }
});

// UNSAFE persist memonic temporary
// since web authentication is not available inside
// chrome extensions

interface PersistedMemonic {
  mnemonic: string;
  at: number;
}

const PASS_KEY = "__pass__";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

async function persistMnemonicUnsafe(mnemonic: string) {
  await chrome.storage.local.set({
    [PASS_KEY]: {
      mnemonic,
      at: Date.now(),
    },
  });
}

async function tryRecoverAndLogin() {
  const result = await chrome.storage.local.get(PASS_KEY);

  const { mnemonic, at } = (result?.[PASS_KEY] ?? {}) as Partial<PersistedMemonic>;

  if (!mnemonic || !at) {
    return;
  }

  if (Date.now() - at > FIFTEEN_MINUTES) {
    await chrome.storage.local.remove(PASS_KEY);
    return;
  }

  await login(mnemonic);
}

export { login, user, tryRecoverAndLogin };
