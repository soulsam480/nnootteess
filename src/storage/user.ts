// NOTE:
// The authentication and ownership works now is kinda unsafe but
// it's fine as long as you're aware of the setup
// 1. as soon as you register/login, you promote self to a superadmin
// 2. the benefit of this is all of your logins across devices, can have
//  full access to ypur data
// 3. the mnemonic is stored in chrome.storage.local for 15 minutes

import { sm } from "@/storage/db";
import { startDirectory } from "@/storage/directory";
import { startState } from "@/storage/state";
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

  await sm().assignRole(address, "superadmin");

  return { address, mnemonic };
}

let directoryUnsub: (() => void) | undefined;
let stateUnsub: (() => void) | undefined;

sm().setSecurityStateChangeCallback((state) => {
  if (state.isActive && state.activeAddress) {
    user.id = state.activeAddress;
    user.state = "authenticated";

    directoryUnsub?.();
    stateUnsub?.();

    startDirectory().then((sub) => {
      directoryUnsub = sub;
    });

    startState().then((sub) => {
      stateUnsub = sub;
    });
  } else {
    directoryUnsub?.();
    stateUnsub?.();
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
