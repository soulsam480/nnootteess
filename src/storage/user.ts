// NOTE:
// The authentication and ownership works now is kinda unsafe but
// it's fine as long as you're aware of the setup
// 1. as soon as you register/login, you promote self to a superadmin
// 2. the benefit of this is all of your logins across devices, can have
//  full access to ypur data
// 3. the mnemonic is stored in chrome.storage.local for 15 minutes

import { sm } from "@/storage/db";
import { Directory, directory, startDirectory } from "@/storage/directory";
import { startState, state } from "@/storage/state";
import { NodeObject } from "genosdb";
import { reactive, toRaw, watch } from "vue";

export interface User {
  id: string | null;
  state: "authenticated" | "inactive";
}

const user = reactive<User>({
  id: null,
  state: "inactive",
});

let directoryUnsub: (() => void) | undefined;
let syncUnsub: (() => void) | undefined;

function syncStateWithDirectory(dir: NodeObject<Directory> | null) {
  if (!dir) {
    return;
  }

  let { active_note, open_notes } = toRaw(state);

  if (active_note && !dir.value.notes[active_note]) {
    active_note = null;
  }

  const available = open_notes.filter((it) => dir.value.notes[it]);

  if (available.length) {
    open_notes = available;
  }

  state.active_note = active_note;
  state.open_notes = open_notes;
}

sm().setSecurityStateChangeCallback((authState) => {
  if (authState.isActive && authState.activeAddress) {
    user.id = authState.activeAddress;
    user.state = "authenticated";

    directoryUnsub?.();

    startDirectory().then((sub) => {
      directoryUnsub = sub;
    });

    startState();
    syncStateWithDirectory(directory.value);

    const { stop } = watch(directory, syncStateWithDirectory);
    syncUnsub = stop;
  } else {
    directoryUnsub?.();
    syncUnsub?.();
  }
});

// ============== HANDLERS ================

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
