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

export interface PersistedMemonic {
  mnemonic: string;
  at: number;
  ttl: Ttl;
}

export type Ttl = "15m" | "1h" | "8h" | "1d";

const TTL_TO_MS: Record<Ttl, number> = {
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "8h": 8 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
};

const PASS_KEY = "__pass__";

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

    startState(authState.activeAddress, isLoggedIn);
    startNotes(authState.activeAddress, isLoggedIn);
    startTabGroups(authState.activeAddress, isLoggedIn);
  }
});

// ============== HANDLERS ================

async function login(storage: LocalStorage, previousMemonic?: string, ttl: Ttl = "15m") {
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

  await persistMnemonicUnsafe(mnemonic, storage, ttl);

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

async function persistMnemonicUnsafe(mnemonic: string, storage: LocalStorage, ttl: Ttl) {
  await storage.set(PASS_KEY, {
    mnemonic,
    at: Date.now(),
    ttl,
  } satisfies PersistedMemonic);
}

async function tryRecoverAndLogin(storage: LocalStorage) {
  const result = await storage.get<Partial<PersistedMemonic>>(PASS_KEY);

  const { mnemonic, at, ttl = "15m" } = result ?? {};

  if (!mnemonic || !at) {
    return;
  }

  if (Date.now() - at > TTL_TO_MS[ttl]) {
    await storage.remove(PASS_KEY);
    return;
  }

  await login(storage, mnemonic);
}

export { login, user, tryRecoverAndLogin, logout, PASS_KEY };
