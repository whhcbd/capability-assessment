<script setup lang="ts">
import type { QuestionnaireMode } from "../types/profile";

defineProps<{
  targetRole: string;
  error: string;
  isAnalyzing: boolean;
}>();

defineEmits<{
  startQuiz: [mode: QuestionnaireMode];
  skipQuiz: [];
  back: [];
}>();
</script>

<template>
  <section class="work-page prompt-page">
    <div class="page-title">
      <p class="eyebrow">Step 2</p>
      <h1>要现在填写能力问卷吗？</h1>
      <p>你已经完成简历和理想岗位信息。可以选择 10 题快速模式跑通演示，也可以完成 48 题详细模式。</p>
    </div>

    <p v-if="error" class="notice error">{{ error }}</p>

    <section class="prompt-panel">
      <div>
        <p class="eyebrow">目标岗位</p>
        <h2>{{ targetRole }}</h2>
        <p>填写问卷后，系统会结合简历和自评生成个人能力雷达；暂不填写时，只展示理想岗位雷达。</p>
      </div>

      <div class="prompt-actions">
        <button class="primary" type="button" @click="$emit('startQuiz', 'quick')">快速模式 · 10 题</button>
        <button class="secondary" type="button" @click="$emit('startQuiz', 'detailed')">详细模式 · 48 题</button>
        <button class="secondary" type="button" :disabled="isAnalyzing" @click="$emit('skipQuiz')">
          {{ isAnalyzing ? "正在生成岗位雷达" : "稍后填写，进入个人界面" }}
        </button>
        <button class="ghost-button" type="button" @click="$emit('back')">返回修改信息</button>
      </div>
    </section>
  </section>
</template>
