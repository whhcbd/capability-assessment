<script setup lang="ts">
import { ref } from "vue";
import RadarChart from "../components/RadarChart.vue";
import type {
  CapabilityProfile,
  CapabilityReportRow,
  ImprovementPlanSection,
  QuestionnaireMode,
  RadarAxis,
  RoleCapabilityProfile,
} from "../types/profile";

defineProps<{
  targetRole: string;
  targetJd: string;
  overallScore: number;
  capabilityProfile: CapabilityProfile | null;
  roleProfile: RoleCapabilityProfile;
  radarAxes: RadarAxis[];
  questionnaireModeLabel: string;
  questionnaireTotal: number;
  rows: CapabilityReportRow[];
  improvementPlan: ImprovementPlanSection[];
  debugJson: string;
  sourceLabel: (source: string) => string;
}>();

type RadarMode = "both" | "user" | "role";

const radarMode = ref<RadarMode>("both");
const isModeDialogOpen = ref(false);

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
  if (item.priority_score >= 4 || item.gap >= 20) return "高优先级";
  if (item.priority_score >= 2 || item.gap >= 10) return "中优先级";
  if (item.gap > 0) return "低优先级";
  return "保持优势";
}

function roleApplication(item: CapabilityReportRow, targetRole: string): string {
  return `在 ${targetRole} 中，「${item.label}」主要指：${item.description} 评估方式：${item.evaluation_method}`;
}

function personalAssessment(item: CapabilityReportRow, sourceLabel: (source: string) => string): string {
  const sources = item.evidence_sources.length ? item.evidence_sources.map(sourceLabel).join("、") : "现有材料";
  return `当前 ${item.score} 分，岗位要求 ${item.required} 分，判定为“${levelLabel(item.score)}”。${item.source_completeness}，依据来自${sources}：${item.evidence_summary}`;
}

function improvementAdvice(item: CapabilityReportRow): string {
  return item.improvement_advice || "暂无 LLM 改进建议。请重新生成能力评估。";
}

const emit = defineEmits<{
  startQuiz: [mode: QuestionnaireMode];
  restart: [];
}>();

function chooseQuestionnaireMode(mode: QuestionnaireMode) {
  isModeDialogOpen.value = false;
  emit("startQuiz", mode);
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
      <button class="secondary" type="button" @click="emit('restart')">重新填写信息</button>
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
        <div class="profile-actions">
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
          <button class="secondary compact" type="button" @click="isModeDialogOpen = true">
            {{ capabilityProfile ? "重新作答问卷" : "去填写问卷" }}
          </button>
        </div>
      </div>
      <div class="radar-stage">
        <RadarChart
          title="能力雷达对比"
          :profile="capabilityProfile"
          :requirements="roleProfile.requirements"
          :axes="radarAxes"
          :display-mode="capabilityProfile ? radarMode : 'role'"
        />
        <div class="radar-legend">
          <span><i class="legend-user" />个人能力</span>
          <span><i class="legend-role" />职业要求</span>
        </div>
      </div>
      <div v-if="!capabilityProfile" class="empty-state inline-empty">
        <strong>个人雷达还没有测试，暂时无法生成。</strong>
        <p>当前已生成岗位专属 6 维能力模型。完成问卷后，系统会把个人证据映射到这些岗位维度。</p>
        <button class="primary" type="button" @click="isModeDialogOpen = true">去填写问卷</button>
      </div>
    </section>

    <section v-if="!capabilityProfile" class="report-card report-list">
      <h2>岗位能力模型</h2>
      <div v-for="item in rows" :key="item.dimension_id" class="insight-row">
        <strong>{{ item.label }}</strong>
        <span>
          要求 {{ item.required }} 分 · 权重 {{ Math.round(item.weight * 100) }}% · {{ item.description }}
        </span>
      </div>
    </section>

    <div v-if="isModeDialogOpen" class="modal-backdrop" role="presentation" @click.self="isModeDialogOpen = false">
      <section class="mode-dialog" role="dialog" aria-modal="true" aria-labelledby="mode-dialog-title">
        <h2 id="mode-dialog-title">选择问卷模式</h2>
        <div class="mode-dialog-actions">
          <button class="primary" type="button" @click="chooseQuestionnaireMode('quick')">快速模式 · 10 题</button>
          <button class="secondary" type="button" @click="chooseQuestionnaireMode('detailed')">
            详细模式 · 48 题
          </button>
          <button class="secondary" type="button" @click="chooseQuestionnaireMode('role_generated')">
            AI 岗位问卷 · 15 题
          </button>
          <button class="ghost-button" type="button" @click="isModeDialogOpen = false">取消</button>
        </div>
      </section>
    </div>

    <template v-if="capabilityProfile">
      <section class="summary-grid">
        <article class="report-card">
          <h2>关键差距</h2>
          <div v-for="item in rows.slice(0, 3)" :key="`gap-${item.dimension_id}`" class="insight-row">
            <strong>{{ item.label }}</strong>
            <span>
              {{ gapLabel(item) }} · 差距 {{ item.gap }} 分 · 权重 {{ Math.round(item.weight * 100) }}% · 优先值
              {{ item.priority_score }}
            </span>
          </div>
        </article>
        <article class="report-card">
          <h2>评价来源</h2>
          <div class="insight-row">
            <strong>综合分口径</strong>
            <span>模型/证据评价 60 + 问卷自评 25 + 人工评价 15；当前未含人工评价，已按已有来源重标化。</span>
          </div>
          <div class="insight-row">
            <strong>证据型评价</strong>
            <span>基于简历中的项目成果、量化数据和结构化问卷答题，不等同于考试客观分。</span>
          </div>
        </article>
      </section>

      <section class="report-card report-list capability-detail-board">
        <h2>能力明细</h2>
        <div class="capability-detail-table">
          <div class="capability-detail-row capability-detail-header">
            <span>能力</span>
            <span>岗位应用场景</span>
            <span>个人能力评估</span>
            <span>针对性改进建议</span>
          </div>
          <div v-for="item in rows" :key="item.key" class="capability-detail-row">
            <div class="capability-name-cell">
              <strong>{{ item.label }}</strong>
              <small>我 {{ item.score }} · 职业 {{ item.required }} · 权重 {{ Math.round(item.weight * 100) }}%</small>
              <small>{{ gapLabel(item) }} · 映射 {{ item.mapped_capability_keys.length }} 个通用能力</small>
              <span>可信度 {{ Math.round(item.confidence * 100) }}%</span>
            </div>
            <p>{{ roleApplication(item, targetRole) }}</p>
            <p>{{ personalAssessment(item, sourceLabel) }}</p>
            <p>{{ improvementAdvice(item) }}</p>
          </div>
        </div>
      </section>

      <section class="report-card report-list">
        <h2>4 周提升计划</h2>
        <div v-if="improvementPlan.length" class="plan-grid">
          <article v-for="section in improvementPlan" :key="section.title" class="plan-section">
            <h3>{{ section.title }}</h3>
            <ul>
              <li v-for="item in section.items" :key="item">{{ item }}</li>
            </ul>
          </article>
        </div>
        <p v-else class="radar-note">当前没有明显岗位差距，建议保持现有优势并继续补充真实项目证据。</p>
      </section>

      <details class="developer-details">
        <summary>开发数据</summary>
        <pre>{{ debugJson }}</pre>
      </details>
    </template>
  </section>
</template>
