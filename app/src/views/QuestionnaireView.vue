<script setup lang="ts">
import { ref } from "vue";
import { likertLabels } from "../data/questionnaire";
import type { CapabilityInfo, QuestionnaireItem } from "../types/profile";

defineProps<{
  item: QuestionnaireItem;
  items: QuestionnaireItem[];
  capability: CapabilityInfo;
  currentIndex: number;
  answer: number | null;
  answers: Record<string, number | null>;
  percent: number;
  completedCount: number;
  totalCount: number;
  modeLabel: string;
  error: string;
}>();

defineEmits<{
  select: [score: number];
  previous: [];
  next: [];
  goToQuestion: [index: number];
  submit: [];
}>();

const isNavigatorOpen = ref(true);
</script>

<template>
  <section class="work-page quiz-page">
    <div class="quiz-layout" :class="{ 'is-nav-collapsed': !isNavigatorOpen }">
      <div class="quiz-main">
        <div class="quiz-top">
          <span>{{ modeLabel }} · 第 {{ currentIndex + 1 }} / {{ totalCount }} 题 · 已答 {{ completedCount }}</span>
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
          <div class="quiz-action-group">
            <button class="secondary" type="button" :disabled="currentIndex === totalCount - 1" @click="$emit('next')">
              下一题
            </button>
            <button class="primary" type="button" @click="$emit('submit')">提交问卷</button>
          </div>
        </div>
      </div>

      <aside class="quiz-navigator" :aria-label="`${modeLabel}题号导航`">
        <button class="navigator-toggle" type="button" @click="isNavigatorOpen = !isNavigatorOpen">
          {{ isNavigatorOpen ? "收起题号" : "打开题号" }}
        </button>
        <div v-if="isNavigatorOpen" class="navigator-panel">
          <div class="navigator-head">
            <div>
              <p class="eyebrow">答题导航</p>
              <strong>{{ completedCount }} / {{ totalCount }}</strong>
            </div>
            <button class="primary" type="button" @click="$emit('submit')">提交</button>
          </div>
          <div class="question-number-grid">
            <button
              v-for="(question, index) in items"
              :key="question.id"
              class="question-number"
              :class="{
                'is-current': index === currentIndex,
                'is-done': answers[question.id] !== null,
              }"
              type="button"
              :aria-current="index === currentIndex ? 'step' : undefined"
              @click="$emit('goToQuestion', index)"
            >
              <span>{{ index + 1 }}</span>
              <i v-if="answers[question.id] !== null">✓</i>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
