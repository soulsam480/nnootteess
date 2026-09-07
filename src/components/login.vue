<script setup lang="ts">
import { storageKey } from "@/storage/local";
import { login, user } from "@/storage/user";
import { useClipboard } from "@vueuse/core";
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

      <div>
        To Get Started
      </div>
      <button
        v-if='loginState.state === "idle"'
        class="mdst-button mdst-button--primary"
        @click="handleLogin"
      >
        Register a new account
      </button>

      <div>Or</div>

      <input
        class="mdst-input"
        placeholder="Login with saved phrase"
        v-model="loginState.mnemonic"
        :disabled='loginState.state === "generated"'
        @keyup.enter="handleLogin"
        type="password"
      />

      <div class="login_dialog__actions">
        <select
          class="mdst-dropdown"
          v-if="loginState.mnemonic"
          v-model="loginState.ttl"
        >
          <option value="">Stay logged in for</option>
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
      </div>

      <p class="mdst-p--muted">You're logged out once this tab is closed</p>
    </div>
  </div>
</template>
