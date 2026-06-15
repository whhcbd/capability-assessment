<script setup lang="ts">
defineEmits<{
  start: [];
}>();
</script>

<template>
  <section class="start-page">
    <div class="start-copy">
      <p class="eyebrow">能力评估</p>
      <h1>用简历和问卷，看清你与目标岗位的能力距离。</h1>
      <p class="lead">
        上传或粘贴简历，选择目标岗位，完成快速或详细问卷。系统会生成个人能力雷达，并和岗位要求进行对比。
      </p>
      <div class="hero-actions">
        <button class="primary large" type="button" @click="$emit('start')">开始评估</button>
        <span>支持 10 题快速模式和 48 题详细模式</span>
      </div>
      <p class="fine-print">结果用于职业发展自评和求职材料诊断，不是医学诊断、心理测评或录用判断。</p>
    </div>

    <aside class="start-preview" aria-label="能力评估产品预览">
      <div class="preview-topbar">
        <span />
        <strong>Capability profile</strong>
        <i>Live</i>
      </div>
      <div class="preview-card preview-score">
        <div>
          <p>目标岗位</p>
          <strong>数据分析实习生</strong>
        </div>
        <span>78</span>
      </div>
      <div class="preview-radar">
        <div class="preview-radar-ring">
          <i class="axis axis-one" />
          <i class="axis axis-two" />
          <i class="axis axis-three" />
          <svg viewBox="0 0 160 160" role="img" aria-label="能力雷达预览">
            <polygon points="80,20 126,48 132,105 80,136 32,108 28,52" class="preview-role-shape" />
            <polygon points="80,36 112,60 118,100 82,120 48,104 42,64" class="preview-user-shape" />
          </svg>
        </div>
      </div>
      <div class="preview-list">
        <div>
          <span>逻辑分析能力</span>
          <strong>82 / 88</strong>
        </div>
        <div>
          <span>数据与数字化思维</span>
          <strong>76 / 86</strong>
        </div>
        <div>
          <span>沟通表达能力</span>
          <strong>74 / 78</strong>
        </div>
      </div>
    </aside>
  </section>
</template>
