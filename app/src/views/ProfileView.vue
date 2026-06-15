<script setup lang="ts">
import { ref } from "vue";
import RadarChart from "../components/RadarChart.vue";
import type {
  CapabilityProfile,
  CapabilityReportRow,
  QuestionnaireMode,
  RoleCapabilityProfile,
} from "../types/profile";

defineProps<{
  targetRole: string;
  targetJd: string;
  overallScore: number;
  capabilityProfile: CapabilityProfile | null;
  roleProfile: RoleCapabilityProfile;
  questionnaireModeLabel: string;
  questionnaireTotal: number;
  rows: CapabilityReportRow[];
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
  if (item.gap >= 20) return "高优先级";
  if (item.gap >= 10) return "中优先级";
  if (item.gap > 0) return "低优先级";
  return "保持优势";
}

const roleScenarioText: Record<string, (targetRole: string, summary: string) => string> = {
  communication_expression: (targetRole, summary) =>
    `在 ${targetRole} 中，这项能力常见于需求沟通、方案评审、跨团队同步和面试表达。岗位要求里提到：${summary} 建议准备一个“把复杂事情讲清楚，并让对方理解或配合”的真实例子。`,
  logical_analysis: (targetRole, summary) =>
    `在 ${targetRole} 中，这项能力主要用在拆问题、找原因、做取舍和解释方案依据。岗位要求里提到：${summary} 建议准备一个你如何从混乱信息里拆出关键问题的案例。`,
  learning_adaptability: (targetRole, summary) =>
    `在 ${targetRole} 中，这项能力会体现在快速上手新工具、新业务和新任务。岗位要求里提到：${summary} 建议准备一个你从不会到能交付的学习过程，而不是只说“学习能力强”。`,
  execution_ownership: (targetRole, summary) =>
    `在 ${targetRole} 中，这项能力落在拆任务、推进进度、按时交付和主动补位。岗位要求里提到：${summary} 建议准备一个你把事情从想法推到结果的例子。`,
  collaboration_leadership: (targetRole, summary) =>
    `在 ${targetRole} 中，这项能力常见于和同学、老师、同事或业务方协调资源。岗位要求里提到：${summary} 建议准备一个你处理分歧、推动他人配合或组织协作的案例。`,
  self_awareness_motivation: (targetRole, summary) =>
    `在 ${targetRole} 中，这项能力体现在你为什么选择这个方向、知道自己适合什么、短板是什么。岗位要求里提到：${summary} 建议准备一段清楚说明“为什么是这个岗位”的职业动机表达。`,
  data_digital_literacy: (targetRole, summary) =>
    `在 ${targetRole} 中，这项能力会体现在用数据看问题、用工具提效率、用指标说明结果。岗位要求里提到：${summary} 建议准备一个你用表格、指标、调研数据或工具辅助判断的例子。`,
  business_industry_understanding: (targetRole, summary) =>
    `在 ${targetRole} 中，这项能力体现在理解用户、行业、公司业务和岗位价值。岗位要求里提到：${summary} 建议准备一个你如何理解目标公司、产品或行业变化的例子。`,
};

const improvementText: Record<string, (item: CapabilityReportRow) => string> = {
  communication_expression: () =>
    "今天做：选一个项目经历，写成 90 秒表达稿，只保留“背景、目标、我的动作、结果”四句；读一遍录音，删掉别人听不懂的缩写和空话。",
  logical_analysis: () =>
    "今天做：拿一个做过的项目或课程作业，画一张问题树：最上面写目标，下面拆 3 个影响因素，每个因素写 1 条证据或数据。",
  learning_adaptability: () =>
    "今天做：选一个目标岗位常见工具或概念，花 30 分钟看入门资料，产出一页笔记：它解决什么问题、你可以在哪个经历里用它。",
  execution_ownership: () =>
    "今天做：把一个经历补成任务清单，写清楚你负责哪 3 件事、每件事的截止时间、最终交付物和遇到阻碍时你怎么推进。",
  collaboration_leadership: () =>
    "今天做：整理一次合作经历，列出参与者、分歧点、你做过的协调动作、最后如何达成一致；不要只写“团队合作良好”。",
  self_awareness_motivation: () =>
    "今天做：写 5 行职业动机：我为什么想做这个岗位、我已有哪段经历能支撑、我还缺什么、接下来一周准备补什么。",
  data_digital_literacy: () =>
    "今天做：给一个经历补 3 个数字，例如用户数、样本量、效率变化、转化率或完成时长；没有现成数据时，用表格把过程量化出来。",
  business_industry_understanding: () =>
    "今天做：打开一家目标公司或产品页面，写下用户是谁、它靠什么创造价值、这个岗位具体帮业务解决什么问题，各写一句话。",
};

function roleApplication(item: CapabilityReportRow, targetRole: string): string {
  return roleScenarioText[item.key]?.(targetRole, item.requirement_summary) ?? item.requirement_summary;
}

function personalAssessment(item: CapabilityReportRow, sourceLabel: (source: string) => string): string {
  const sources = item.evidence_sources.length ? item.evidence_sources.map(sourceLabel).join("、") : "现有材料";
  return `当前 ${item.score} 分，岗位要求 ${item.required} 分，判定为“${levelLabel(item.score)}”。依据来自${sources}：${item.evidence_summary}`;
}

function improvementAdvice(item: CapabilityReportRow): string {
  const action = improvementText[item.key]?.(item) ?? "今天做：选一个最近经历，补齐背景、你的动作、结果和复盘。";
  if (item.gap > 0) return `${action} 这项和岗位要求还有 ${item.gap} 分差距，先补能写进简历或面试的证据。`;
  return `${action} 当前接近岗位要求，重点是把已有优势整理成能讲清楚、能被追问的材料。`;
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
        <button class="primary" type="button" @click="isModeDialogOpen = true">去填写问卷</button>
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
          <button class="ghost-button" type="button" @click="isModeDialogOpen = false">取消</button>
        </div>
      </section>
    </div>

    <template v-if="capabilityProfile">
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
              <small>我 {{ item.score }} · 职业 {{ item.required }} · {{ gapLabel(item) }}</small>
              <span>可信度 {{ Math.round(item.confidence * 100) }}%</span>
            </div>
            <p>{{ roleApplication(item, targetRole) }}</p>
            <p>{{ personalAssessment(item, sourceLabel) }}</p>
            <p>{{ improvementAdvice(item) }}</p>
          </div>
        </div>
      </section>

      <details class="developer-details">
        <summary>开发数据</summary>
        <pre>{{ debugJson }}</pre>
      </details>
    </template>
  </section>
</template>
