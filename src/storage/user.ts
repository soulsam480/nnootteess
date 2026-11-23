// NOTE:
// The authentication and ownership works now is kinda unsafe but
// it's fine as long as you're aware of the setup
// 1. as soon as you register/login, you promote self to a superadmin
// 2. the benefit of this is all of your logins across devices, can have
//  full access to ypur data
// 3. the mnemonic is stored in local storage for 15 minutes

import { securityAction } from "@/storage/auth-state";
import { db, sm } from "@/storage/db";
import { migrateNotesForCurrentUser } from "@/storage/migration";
import { forgetLegacyKey } from "@/storage/notes";
import { startState } from "@/storage/state";
import { computed, reactive } from "vue";
import { LocalStorage } from "@/storage/local";
import { startNotes } from "@/storage/notes";
import { startTabGroups } from "@/storage/tabGroups";
import { startDirectory } from "@/storage/directory";

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

let privateKey: string | null = null;

function getPrivateKey(): string | null {
  return privateKey;
}

const user = reactive<UserState>({
  id: null,
  state: "inactive",
});

const isLoggedIn = computed(() => user.state === "authenticated");

let activating = false;

function activate(activeAddress: string) {
  if (user.state === "copying") {
    return;
  }

  if (user.state === "authenticated" && user.id === activeAddress) {
    return;
  }

  user.id = activeAddress;
  user.state = "authenticated";

  startState(activeAddress, isLoggedIn);
  startNotes(activeAddress, isLoggedIn);
  startTabGroups(activeAddress, isLoggedIn);
  startDirectory(activeAddress, isLoggedIn);
}

function deactivate() {
  privateKey = null;
  user.id = null;
  user.state = "inactive";
}

sm().setSecurityStateChangeCallback((authState) => {
  const action = securityAction(user.state, authState, activating);

  if (action.kind === "activate") {
    activate(action.address);
  } else if (action.kind === "deactivate") {
    deactivate();
  }
});

// ============== HANDLERS ================

async function login(storage: LocalStorage, previousMemonic?: string, ttl: Ttl = "15m") {
  activating = true;
  let activatedAddress: string | null = null;

  try {
    const identity: Record<string, string> | null = previousMemonic
      ? await sm().loginOrRecoverUserWithMnemonic(previousMemonic)
      : await sm().startNewUserRegistration();

    if (!identity) {
      return;
    }

    const { address, mnemonic } = identity;
    activatedAddress = address;
    let activeIdentity = identity;

    if (!previousMemonic) {
      activeIdentity = await sm().loginOrRecoverUserWithMnemonic(mnemonic);
    }

    if (activeIdentity?.privateKey) {
      privateKey = activeIdentity.privateKey;

      try {
        await migrateNotesForCurrentUser({ db: db(), sm: sm(), address, privateKey });
      } catch (error) {
        console.error("[migration] sweep failed", error);
      }
    }

    await persistMnemonicUnsafe(mnemonic, storage, ttl);

    return { address, mnemonic };
  } finally {
    if (activatedAddress) {
      activate(activatedAddress);
    }

    activating = false;
  }
}

async function logout(storage: LocalStorage) {
  await sm().clearSecurity();
  await storage.remove(PASS_KEY);
  deactivate();
  forgetLegacyKey();
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

export { login, user, tryRecoverAndLogin, logout, getPrivateKey, PASS_KEY };
