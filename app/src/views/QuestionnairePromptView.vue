<script setup lang="ts">
defineProps<{
  targetRole: string;
  error: string;
  isAnalyzing: boolean;
}>();

defineEmits<{
  startQuiz: [];
  skipQuiz: [];
  back: [];
}>();
</script>

<template>
  <section class="work-page prompt-page">
    <div class="page-title">
      <p class="eyebrow">Step 2</p>
      <h1>要现在填写能力问卷吗？</h1>
      <p>你已经完成简历和理想岗位信息。可以现在完成 48 题问卷，也可以先进入个人界面查看理想岗位能力雷达。</p>
    </div>

    <p v-if="error" class="notice error">{{ error }}</p>

    <section class="prompt-panel">
      <div>
        <p class="eyebrow">目标岗位</p>
        <h2>{{ targetRole }}</h2>
        <p>填写问卷后，系统会结合简历和自评生成个人能力雷达；暂不填写时，只展示理想岗位雷达。</p>
      </div>

      <div class="prompt-actions">
        <button class="primary" type="button" @click="$emit('startQuiz')">现在填写问卷</button>
        <button class="secondary" type="button" :disabled="isAnalyzing" @click="$emit('skipQuiz')">
          {{ isAnalyzing ? "正在生成岗位雷达" : "稍后填写，进入个人界面" }}
        </button>
        <button class="ghost-button" type="button" @click="$emit('back')">返回修改信息</button>
      </div>
    </section>
  </section>
</template>
