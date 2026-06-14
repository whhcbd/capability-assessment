<script setup lang="ts">
defineEmits<{
  start: [];
}>();
</script>

<template>
  <section class="start-page">
    <p class="eyebrow">Career Capability Assessment</p>
    <h1>用一份简历和一套问卷，看清你与心仪职业的能力距离。</h1>
    <p class="lead">
      上传或粘贴简历，填写心仪职业，选择 10 题快速模式或 48 题详细模式。系统会生成你的能力雷达，并和目标职业要求进行对比。
    </p>
    <button class="primary large" type="button" @click="$emit('start')">开始评估</button>
    <p class="fine-print">结果用于职业发展自评和求职材料诊断，不是医学诊断、心理测评或录用判断。</p>
  </section>
</template>
