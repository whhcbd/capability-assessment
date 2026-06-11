<script setup lang="ts">
import { likertLabels, questionnaireItems } from "../data/questionnaire";
import type { CapabilityInfo, QuestionnaireItem } from "../types/profile";

defineProps<{
  item: QuestionnaireItem;
  capability: CapabilityInfo;
  currentIndex: number;
  answer: number | null;
  percent: number;
  error: string;
}>();

defineEmits<{
  select: [score: number];
  previous: [];
  next: [];
  submit: [];
}>();
</script>

<template>
  <section class="work-page quiz-page">
    <div class="quiz-top">
      <span>第 {{ currentIndex + 1 }} / {{ questionnaireItems.length }} 题</span>
      <div class="progress-line"><i :style="{ width: `${percent}%` }" /></div>
    </div>

    <p v-if="error" class="notice error">{{ error }}</p>

    <div class="question-block">
      <p class="eyebrow">{{ capability.label }} · {{ item.indicator }}</p>
      <h1>{{ item.text }}</h1>
      <div class="choice-list">
        <button
          v-for="(label, index) in likertLabels"
          :key="label"
          class="choice-button"
          type="button"
          :aria-pressed="answer === index + 1"
          @click="$emit('select', index + 1)"
        >
          <strong>{{ index + 1 }}</strong>
          <span>{{ label }}</span>
        </button>
      </div>
    </div>

    <div class="quiz-actions">
      <button class="secondary" type="button" :disabled="currentIndex === 0" @click="$emit('previous')">
        上一题
      </button>
      <button
        class="primary"
        type="button"
        @click="currentIndex === questionnaireItems.length - 1 ? $emit('submit') : $emit('next')"
      >
        {{ currentIndex === questionnaireItems.length - 1 ? "生成报告" : "下一题" }}
      </button>
    </div>
  </section>
</template>
