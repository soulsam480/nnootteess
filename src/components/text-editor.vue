<script type="module" lang="ts">
export const editorReadonlyEnabled = useStorage("readonly_mode", false);
</script>

<script setup lang="ts">
import { Milkdown, useEditor } from "@milkdown/vue";
import { Crepe } from "@milkdown/crepe";
import { mdstDark } from "@/utils/dark";
import { useStorage } from "@vueuse/core";
import { watch } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "focus"): void;
}>();

useEditor((root) => {
  const crepe = new Crepe({
    root,
    defaultValue: props.modelValue,
    features: {
      [Crepe.Feature.ImageBlock]: false,
      [Crepe.Feature.Latex]: false,
    },
    featureConfigs: {
      [Crepe.Feature.CodeMirror]: {
        extensions: [mdstDark],
      },
    },
  });

  watch(editorReadonlyEnabled, (value) => {
    crepe.setReadonly(value);
  }, { immediate: true });

  crepe.on((listener) => {
    listener.markdownUpdated((_, md) => {
      emits("update:modelValue", md);
    });

    listener.focus(() => {
      emits("focus");
    });
  });

  return crepe;
});
</script>

<template>
  <Milkdown />
</template>
