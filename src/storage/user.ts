// NOTE:
// The authentication and ownership works now is kinda unsafe but
// it's fine as long as you're aware of the setup
// 1. as soon as you register/login, you promote self to a superadmin
// 2. the benefit of this is all of your logins across devices, can have
//  full access to ypur data
// 3. the mnemonic is stored in local storage for 15 minutes

import { sm } from "@/storage/db";
import { startState } from "@/storage/state";
import { computed, reactive } from "vue";
import { LocalStorage } from "@/storage/local";
import { startNotes } from "@/storage/notes";
import { startTabGroups } from "@/storage/tabGroups";

interface UserState {
  id: string | null;
  state: "authenticated" | "inactive" | "copying";
}

interface PersistedMemonic {
  mnemonic: string;
  at: number;
}

const PASS_KEY = "__pass__";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const user = reactive<UserState>({
  id: null,
  state: "inactive",
});

const isLoggedIn = computed(() => user.state === "authenticated");

sm().setSecurityStateChangeCallback((authState) => {
  if (authState.isActive && authState.activeAddress) {
    if (user.state === "copying") {
      return;
    }

    user.id = authState.activeAddress;
    user.state = "authenticated";

    startState();

    startNotes(isLoggedIn);

    startTabGroups(isLoggedIn);
  }
});

// ============== HANDLERS ================

async function login(storage: LocalStorage, previousMemonic?: string) {
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

  await persistMnemonicUnsafe(mnemonic, storage);

  await sm().assignRole(address, "superadmin");

  return { address, mnemonic };
}

async function logout(storage: LocalStorage) {
  await sm().clearSecurity();
  await storage.remove(PASS_KEY);
  user.id = null;
  user.state = "inactive";
}

// UNSAFE persist memonic temporary
// since web authentication is not available inside
// chrome extensions

async function persistMnemonicUnsafe(mnemonic: string, storage: LocalStorage) {
  await storage.set(PASS_KEY, {
    mnemonic,
    at: Date.now(),
  });
}

async function tryRecoverAndLogin(storage: LocalStorage) {
  const result = await storage.get<Partial<PersistedMemonic>>(PASS_KEY);

  const { mnemonic, at } = result ?? {};

  if (!mnemonic || !at) {
    return;
  }

  if (Date.now() - at > FIFTEEN_MINUTES) {
    await storage.remove(PASS_KEY);
    return;
  }

  await login(storage, mnemonic);
}

export { login, user, tryRecoverAndLogin, logout };
