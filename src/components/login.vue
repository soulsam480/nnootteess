<script setup lang="ts">
import { storageKey } from "@/storage/local";
import { login } from "@/storage/user";
import { useClipboard } from "@vueuse/core";
import { inject, shallowReactive } from "vue";

interface LoginState {
  state: "generated" | "idle";
  mnemonic: string;
}

const loginState = shallowReactive<LoginState>({
  state: "idle",
  mnemonic: "",
});

const storage = inject(storageKey);

async function handleLogin() {
  if (!storage) return;

  const phrase = loginState.mnemonic;

  const id = await login(storage, phrase || undefined);

  if (!id) {
    return;
  }

  if (!phrase) {
    loginState.state = "generated";
    loginState.mnemonic = id.mnemonic;
  }
}

const { copy, copyPending } = useClipboard();
</script>

<template>
  <div
    class="mdst-card login-dialog"
  >
    <div class="mdst-card-body">
      <div class="login-dialog__header">
        <h2 class="mdst-card-title">
          Welcome to NNOOTTEESS
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

      <textarea
        class="mdst-input"
        placeholder="Login with saved phrase"
        v-model="loginState.mnemonic"
        :disabled='loginState.state === "generated"'
        @keyup.enter="handleLogin"
      ></textarea>

      <button
        v-if='loginState.state === "generated"'
        class="mdst-button"
        @click="copy(loginState.mnemonic)"
        :disabled="copyPending"
      >
        Copy Login Phrease, Don't Lose it!
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-dialog {
  min-width: 32rem;
  margin: auto;

  .mdst-card-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--mdst-space-2);
  }

  .login-dialog__header {
    text-align: center;
    margin-bottom: var(--mdst-space-6);
  }
}
</style>
