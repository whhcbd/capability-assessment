<script setup lang="ts">
import type { FlowView } from "../types/profile";

const props = defineProps<{
  view: FlowView;
}>();

const steps = ["简历与职业", "问卷选择", "个人界面"];

function activeIndex(view: FlowView): number {
  if (view === "questionnairePrompt" || view === "quiz") return 1;
  if (view === "analyzing" || view === "profile") return 2;
  return 0;
}
</script>

<template>
  <nav class="top-progress" aria-label="流程进度">
    <span v-for="(step, index) in steps" :key="step" :class="{ 'is-active': index <= activeIndex(props.view) }">
      <i>{{ index + 1 }}</i>
      {{ step }}
    </span>
  </nav>
</template>
