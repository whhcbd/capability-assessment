<script setup lang="ts">
import RadarChart from "../components/RadarChart.vue";
import type { CapabilityProfile, CapabilityReportRow, RoleCapabilityProfile } from "../types/profile";

defineProps<{
  targetRole: string;
  overallScore: number;
  capabilityProfile: CapabilityProfile;
  roleProfile: RoleCapabilityProfile;
  rows: CapabilityReportRow[];
  strengths: CapabilityReportRow[];
  gaps: CapabilityReportRow[];
  debugJson: string;
  sourceLabel: (source: string) => string;
}>();

defineEmits<{
  restart: [];
}>();
</script>

<template>
  <section class="report-page">
    <div class="report-head">
      <div>
        <p class="eyebrow">Assessment Report</p>
        <h1>{{ targetRole }} 能力对比</h1>
        <p class="lead">综合分 {{ overallScore }} / 100。请结合证据可信度阅读，不把低分直接理解为能力差。</p>
      </div>
      <button class="secondary" type="button" @click="$emit('restart')">重新评估</button>
    </div>

    <section class="radar-comparison">
      <div class="radar-panel">
        <h2>我的能力雷达</h2>
        <RadarChart title="我的能力雷达" :profile="capabilityProfile" />
      </div>
      <div class="radar-panel">
        <h2>心仪职业雷达</h2>
        <RadarChart title="心仪职业雷达" :requirements="roleProfile.requirements" />
      </div>
    </section>

    <section class="summary-grid">
      <div class="report-card">
        <h2>相对优势</h2>
        <div v-for="item in strengths" :key="item.key" class="insight-row">
          <strong>{{ item.label }}</strong>
          <span>当前 {{ item.score }} / 要求 {{ item.required || "未标注" }}</span>
        </div>
      </div>
      <div class="report-card">
        <h2>优先补齐</h2>
        <div v-for="item in gaps" :key="item.key" class="insight-row">
          <strong>{{ item.label }}</strong>
          <span>{{ item.gap ? `差距 ${item.gap}` : "当前接近要求" }}</span>
        </div>
      </div>
    </section>

    <section class="report-card report-list">
      <h2>能力明细</h2>
      <div v-for="item in rows" :key="item.key" class="capability-row">
        <div>
          <strong>{{ item.label }}</strong>
          <p>{{ item.evidence_summary }}</p>
          <small>
            来源：{{ item.evidence_sources.length ? item.evidence_sources.map(sourceLabel).join("、") : "证据不足" }}
            · 可信度 {{ Math.round(item.confidence * 100) }}%
          </small>
        </div>
        <div class="score-stack">
          <span>我 {{ item.score }}</span>
          <span>职业 {{ item.required }}</span>
        </div>
      </div>
    </section>

    <section class="advice-section">
      <h2>下一步建议</h2>
      <ul>
        <li>把差距最大的能力补成简历证据：写清楚场景、个人动作、结果和反馈。</li>
        <li>如果某项能力可信度低，优先补具体项目经历，不要只在面试里口头解释。</li>
        <li>围绕 {{ targetRole }} 重写一段求职动机，说明经历和岗位任务之间的连接。</li>
      </ul>
    </section>

    <details class="developer-details">
      <summary>开发数据</summary>
      <pre>{{ debugJson }}</pre>
    </details>
  </section>
</template>
