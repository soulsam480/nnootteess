<script setup lang="ts">
import { login } from "@/storage/user";
import { useClipboard } from "@vueuse/core";
import { shallowReactive } from "vue";

interface LoginState {
  state: "generated" | "idle";
  mnemonic: string;
}

const loginState = shallowReactive<LoginState>({
  state: "idle",
  mnemonic: "",
});

async function handleLogin() {
  const phrase = loginState.mnemonic;

  const id = await login(phrase || undefined);

  if (!id) {
    return;
  }

  if (!phrase) {
    loginState.state = "generated";
    loginState.mnemonic = id.mnemonic;
  }
}

const { copy, copyPending } = useClipboard();

function handleCancel(e: Event) {
  e.preventDefault();
}
</script>

<template>
  <dialog
    open
    id="my-dialog"
    class="mdst-dialog login-dialog"
    @cancel="handleCancel"
  >
    <div class="mdst-dialog-header">
      <h2 class="mdst-dialog-title">
        Create an account to persist and sync notes
      </h2>
      <button class="mdst-dialog-close" commandfor="my-dialog" command="close">
        ✕
      </button>
    </div>
    <div class="mdst-dialog-body">
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
  </dialog>
</template>

<style scoped>
.login-dialog {
  min-width: 32rem;
  .mdst-dialog-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--mdst-space-2);
  }
}
</style>
