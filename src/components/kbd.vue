<script setup lang="ts">
import { IS_MAC } from "@/utils/platform";
import { computed } from "vue";

const SHORT_TO_ICON: Record<string, string> = {
  "$mod": IS_MAC ? "⌘" : "Ctrl",
  "Shift": "⇧",
  "Alt": IS_MAC ? "⌥" : "Alt",
  Control: IS_MAC ? "⌃" : "Ctrl",
};

const KEY_PREFIX = /^Key/;

const props = defineProps<{
  kbd: string;
}>();

const parts = computed(() =>
  props.kbd.split("+").map((it) => {
    it = it.trim();

    if (KEY_PREFIX.test(it)) {
      return it.replace(KEY_PREFIX, "").toLowerCase();
    }

    return it;
  })
);
</script>

<template>
  <kbd class="mdst-kbd" v-for="keyCode in parts" :key="keyCode">
    <template v-if="SHORT_TO_ICON[keyCode]">
      {{ SHORT_TO_ICON[keyCode] }}
    </template>

    <template v-else>
      {{ keyCode }}
    </template>
  </kbd>
</template>
