<script setup lang="ts">
import type { QuestionnaireMode } from "../types/profile";

defineProps<{
  targetRole: string;
  error: string;
  isAnalyzing: boolean;
  isGeneratingQuestionnaire: boolean;
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
      <p>岗位专属能力模型已生成。可以选择 10 题快速模式、48 题详细模式，或生成 15 题 AI 岗位问卷。</p>
    </div>

    <p v-if="error" class="notice error">{{ error }}</p>

    <section class="prompt-panel">
      <div>
        <p class="eyebrow">目标岗位</p>
        <h2>{{ targetRole }}</h2>
        <p>填写问卷后，系统会把简历和自评证据映射到岗位 6 维；暂不填写时，只展示岗位能力模型。</p>
      </div>

      <div class="prompt-actions">
        <button class="primary" type="button" @click="$emit('startQuiz', 'quick')">快速模式 · 10 题</button>
        <button class="secondary" type="button" @click="$emit('startQuiz', 'detailed')">详细模式 · 48 题</button>
        <button
          class="secondary"
          type="button"
          :disabled="isGeneratingQuestionnaire"
          @click="$emit('startQuiz', 'role_generated')"
        >
          {{ isGeneratingQuestionnaire ? "正在生成 AI 岗位问卷" : "AI 岗位问卷 · 15 题" }}
        </button>
        <button class="secondary" type="button" :disabled="isAnalyzing" @click="$emit('skipQuiz')">
          {{ isAnalyzing ? "正在进入个人界面" : "稍后填写，进入个人界面" }}
        </button>
        <button class="ghost-button" type="button" @click="$emit('back')">返回修改信息</button>
      </div>
    </section>
  </section>
</template>
