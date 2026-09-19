<script setup lang="ts">
import { ref } from "vue";
import { useWhiteboard } from "vue-whiteboard-composable";

const svgRef = ref<SVGSVGElement | null>(null);
const color = ref("#333333");
const size = ref("5px");

const {
  undo,
  redo,
  clear,
  save,
  canUndo,
  canRedo,
  history,
  currentIndex,
  serialize,
  jumpTo,
  removeFromHistory,
} = useWhiteboard(svgRef, {
  color,
  size,
  backgroundColor: "#ffffff",
});
</script>

<template>
  <svg ref="svgRef" class="my-whiteboard" />
  <div class="toolbar">
    <button :disabled="!canUndo" @click="undo">Undo</button>
    <button :disabled="!canRedo" @click="redo">Redo</button>
    <button @click="clear">Clear</button>
    <button @click="save().then((dataUrl) => console.log(dataUrl))">
      Save PNG
    </button>
    <button @click="console.log(serialize())">Serialize</button>

    <!-- History Navigation -->
    <div class="history">
      <div
        v-for="(item, index) in history"
        :key="item.id"
        :class="{ active: index === currentIndex }"
        @click="jumpTo(index)"
      >
        {{ item.type }}
        <button @click.stop="removeFromHistory(index)">x</button>
      </div>
    </div>
  </div>
</template>
