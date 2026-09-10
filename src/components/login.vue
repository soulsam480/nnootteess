<script setup lang="ts">
import { sm } from "@/storage/db";
import { storageKey } from "@/storage/local";
import { login, user } from "@/storage/user";
import { computedAsync, useClipboard } from "@vueuse/core";
import { inject, shallowReactive } from "vue";

interface LoginState {
  state: "generated" | "idle";
  mnemonic: string;
  ttl: "15m" | "1h" | "8h" | "1d";
}

const loginState = shallowReactive<LoginState>({
  state: "idle",
  mnemonic: "",
  ttl: "15m",
});

const storage = inject(storageKey);

async function handleLogin() {
  if (!storage) return;

  const phrase = loginState.mnemonic || undefined;

  if (!phrase) {
    user.state = "copying";
  }

  const id = await login(storage, phrase || undefined, loginState.ttl);

  if (!id) {
    return;
  }

  if (!phrase) {
    loginState.state = "generated";
    loginState.mnemonic = id.mnemonic;
  }
}

const { copy, copyPending } = useClipboard();

async function handleCopy() {
  if (!storage) return;

  await copy(loginState.mnemonic);

  user.state = "inactive";
  login(storage, loginState.mnemonic, loginState.ttl);
}

async function handleLoginWithPassKey() {
  await sm().loginCurrentUserWithWebAuthn();
}

const hasPasskey = computedAsync(async () => {
  return await sm().hasExistingWebAuthnRegistration();
}, false);
</script>

<template>
  <div
    class="mdst-card login-dialog"
  >
    <div class="mdst-card-body">
      <div class="login-dialog__header">
        <h2 class="mdst-card-title">
          Welcome to NOTESx2
        </h2>
        <div>
          Your notes sync P2P with E2E encryption across devices / browsers /
          tabs
        </div>
      </div>

      <button
        v-if='loginState.state === "idle"'
        class="mdst-button mdst-button--primary"
        @click="handleLogin"
      >
        Register a new account
      </button>

      <hr class="mdst-hr" style="width: 100%; margin: var(--mdst-space-4)" />

      <input
        class="mdst-input"
        placeholder="Login with saved phrase"
        v-model="loginState.mnemonic"
        :disabled='loginState.state === "generated"'
        @keyup.enter="handleLogin"
        type="password"
      />

      <div
        v-if='loginState.state === "idle" && !loginState.mnemonic && hasPasskey'
      >
        Or
      </div>

      <div class="login_dialog__actions">
        <select
          class="mdst-dropdown"
          v-if="loginState.mnemonic"
          v-model="loginState.ttl"
        >
          <option value="">Stay logged in this tab for</option>
          <option value="15m">15 Minutes</option>
          <option value="1h">1 Hour</option>
          <option value="8h">8 Hours</option>
          <option value="1d">1 Day</option>
        </select>

        <button
          v-if='loginState.state === "generated"'
          class="mdst-button mdst-button--inverted"
          @click="handleCopy()"
          :disabled="copyPending"
        >
          Copy Login Phrease, Don't Lose it!
        </button>

        <button
          v-if='loginState.state === "idle" && loginState.mnemonic'
          class="mdst-button mdst-button--inverted"
          @click="handleLogin"
        >
          Login
        </button>

        <button
          v-if='loginState.state === "idle" && !loginState.mnemonic && hasPasskey'
          class="mdst-button mdst-button--inverted"
          @click="handleLoginWithPassKey"
        >
          Login with Passkey
        </button>
      </div>
    </div>
  </div>
</template>
