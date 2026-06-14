<script setup lang="ts">
import { ref } from "vue";
import RadarChart from "../components/RadarChart.vue";
import type { CapabilityProfile, CapabilityReportRow, RoleCapabilityProfile } from "../types/profile";

defineProps<{
  targetRole: string;
  targetJd: string;
  overallScore: number;
  capabilityProfile: CapabilityProfile | null;
  roleProfile: RoleCapabilityProfile;
  questionnaireModeLabel: string;
  questionnaireTotal: number;
  rows: CapabilityReportRow[];
  strengths: CapabilityReportRow[];
  gaps: CapabilityReportRow[];
  debugJson: string;
  sourceLabel: (source: string) => string;
}>();

defineEmits<{
  startQuiz: [];
  restart: [];
}>();

type RadarMode = "both" | "user" | "role";

const radarMode = ref<RadarMode>("both");

const radarModes: Array<{ value: RadarMode; label: string }> = [
  { value: "both", label: "叠加" },
  { value: "user", label: "个人" },
  { value: "role", label: "职业" },
];

function levelLabel(score: number): string {
  if (score >= 85) return "优势明显";
  if (score >= 70) return "基础稳定";
  if (score >= 55) return "需要补强";
  return "证据偏弱";
}

function gapLabel(item: CapabilityReportRow): string {
  if (item.gap >= 20) return "高优先级";
  if (item.gap >= 10) return "中优先级";
  if (item.gap > 0) return "低优先级";
  return "保持优势";
}

function roleApplication(item: CapabilityReportRow, targetRole: string): string {
  return `${item.label}在 ${targetRole} 中主要用于${item.requirement_summary} 面试时可以准备一个能体现该能力的项目或实习案例，说明任务背景、你的判断和最终结果。`;
}

function personalAssessment(item: CapabilityReportRow, sourceLabel: (source: string) => string): string {
  const sources = item.evidence_sources.length ? item.evidence_sources.map(sourceLabel).join("、") : "现有材料";
  return `当前 ${item.score} 分，岗位要求 ${item.required} 分，判定为“${levelLabel(item.score)}”。依据来自${sources}：${item.evidence_summary}`;
}

function improvementAdvice(item: CapabilityReportRow): string {
  if (item.gap > 0) {
    return `优先补齐 ${item.gap} 分差距：选择一个近期经历，用 STAR 结构补充目标、个人动作、量化结果和复盘；如果简历缺证据，本周补一个小练习或案例分析。`;
  }
  return `当前已接近或超过岗位要求：保留一段最强证明材料，并准备面试追问中的数据、反馈和个人贡献细节。`;
}

function actionItems(rows: CapabilityReportRow[]) {
  return [...rows]
    .sort((a, b) => b.gap - a.gap || a.confidence - b.confidence)
    .slice(0, 5)
    .map((item, index) => ({
      id: item.key,
      priority: index + 1,
      capability: item.label,
      level: gapLabel(item),
      scene: item.requirement_summary,
      action:
        item.gap > 0
          ? `今天先写出一个能证明“${item.label}”的经历草稿，补齐背景、个人动作、结果指标和复盘。`
          : `今天整理一条“${item.label}”优势案例，准备 60 秒版本和 2 分钟追问版本。`,
    }));
}
</script>

<template>
  <section class="profile-page">
    <div class="report-head">
      <div>
        <p class="eyebrow">Personal Profile</p>
        <h1>{{ targetRole }} 个人界面</h1>
        <p class="lead">
          这里汇总你的理想岗位能力要求和个人能力测试结果。个人能力雷达需要完成问卷后才会生成。
        </p>
      </div>
      <button class="secondary" type="button" @click="$emit('restart')">重新填写信息</button>
    </div>

    <section class="profile-summary">
      <div>
        <p class="eyebrow">理想岗位</p>
        <h2>{{ targetRole }}</h2>
      </div>
      <p>{{ targetJd.slice(0, 180) }}{{ targetJd.length > 180 ? "..." : "" }}</p>
    </section>

    <section class="radar-panel radar-workspace">
      <div class="radar-toolbar">
        <div>
          <h2>能力雷达对比</h2>
          <p class="radar-note">
            <template v-if="capabilityProfile">
              {{ questionnaireModeLabel }} · {{ questionnaireTotal }} 题 · 综合分 {{ overallScore }} / 100
            </template>
            <template v-else>当前仅显示理想岗位要求，完成问卷后可叠加个人能力。</template>
          </p>
        </div>
        <div class="mode-toggle" aria-label="雷达显示模式">
          <button
            v-for="mode in radarModes"
            :key="mode.value"
            type="button"
            :disabled="mode.value === 'user' && !capabilityProfile"
            :aria-pressed="radarMode === mode.value"
            @click="radarMode = mode.value"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>
      <div class="radar-stage">
        <RadarChart
          title="能力雷达对比"
          :profile="capabilityProfile"
          :requirements="roleProfile.requirements"
          :display-mode="capabilityProfile ? radarMode : 'role'"
        />
        <div class="radar-legend">
          <span><i class="legend-user" />个人能力</span>
          <span><i class="legend-role" />职业要求</span>
        </div>
      </div>
      <div v-if="!capabilityProfile" class="empty-state inline-empty">
        <strong>个人雷达还没有测试，暂时无法生成。</strong>
        <p>完成快速或详细问卷后，系统会结合简历证据生成个人能力画像。</p>
        <button class="primary" type="button" @click="$emit('startQuiz')">去填写问卷</button>
      </div>
    </section>

    <template v-if="capabilityProfile">
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

      <section class="report-card report-list capability-detail-board">
        <h2>能力明细</h2>
        <div v-for="item in rows" :key="item.key" class="capability-detail">
          <div class="capability-detail-head">
            <div>
              <strong>{{ item.label }}</strong>
              <small>我 {{ item.score }} · 职业 {{ item.required }} · {{ gapLabel(item) }}</small>
            </div>
            <span>可信度 {{ Math.round(item.confidence * 100) }}%</span>
          </div>
          <div class="capability-blocks">
            <article>
              <h3>岗位应用场景</h3>
              <p>{{ roleApplication(item, targetRole) }}</p>
            </article>
            <article>
              <h3>个人能力评估</h3>
              <p>{{ personalAssessment(item, sourceLabel) }}</p>
            </article>
            <article>
              <h3>针对性改进建议</h3>
              <p>{{ improvementAdvice(item) }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="advice-section">
        <h2>可执行行动清单</h2>
        <div class="action-list">
          <article v-for="item in actionItems(rows)" :key="item.id" class="action-item">
            <span>优先级 {{ item.priority }}</span>
            <div>
              <strong>{{ item.capability }} · {{ item.level }}</strong>
              <p>岗位场景：{{ item.scene }}</p>
              <p>今天开始：{{ item.action }}</p>
            </div>
          </article>
        </div>
      </section>

      <details class="developer-details">
        <summary>开发数据</summary>
        <pre>{{ debugJson }}</pre>
      </details>
    </template>
  </section>
</template>
