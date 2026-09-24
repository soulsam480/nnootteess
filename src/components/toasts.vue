<script lang="ts" type="module">
import { shallowRef } from "vue";

export interface Toast {
  message: string;
  persistent?: boolean;
  type?: "info" | "success" | "warning" | "error";
  action?: {
    label: string;
    perform: () => void;
  };
}

interface IdentifiedToast extends Toast {
  id: string;
}

export const toasts = shallowRef<IdentifiedToast[]>([]);

export function removeToast(id: string) {
  const el = document.querySelector<HTMLOutputElement>(`.mdst-toast[id="${id}"]`);

  if (!el) {
    return;
  }

  el.setAttribute("data-state", "hidden");

  el.addEventListener("transitionend", (event) => {
    if (event.target instanceof HTMLElement) {
      event.target.remove();
    }

    toasts.value = toasts.value.filter((it) => it.id !== id);
  });
}

export function showToast(toast: Toast): string {
  const id = window.crypto.randomUUID();

  toasts.value = [...toasts.value, { ...toast, id }];

  if (!toast.persistent) {
    window.setTimeout(() => {
      removeToast(id);
    }, 3000);
  }

  return id;
}

function handleAction(toast: IdentifiedToast) {
  toast.action?.perform();
  removeToast(toast.id);
}
</script>

<script setup lang="ts">
import CarbonClose from "~icons/carbon/close";
</script>

<template>
  <div class="mdst-toast-group">
    <output
      v-for="toast in toasts"
      :key="toast.id"
      class="mdst-toast"
      data-state="visible"
      :data-variant="toast.type ?? 'info'"
      :id="toast.id"
    >
      {{ toast.message }}

      <button
        v-if="toast.action"
        @click="handleAction(toast)"
        class="mdst-button mdst-button--ghost mdst-button--sm"
      >
        {{ toast.action.label }}
      </button>

      <button
        v-if="!toast.persistent"
        @click="removeToast(toast.id)"
        class="mdst-toast-close"
        aria-label="Dismiss"
      >
        <CarbonClose />
      </button>
    </output>
  </div>
</template>
