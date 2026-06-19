import { computed, reactive } from "vue";
import { capabilities, capabilityByKey } from "../data/capabilities";
import { questionnaireItems, quickQuestionnaireItems } from "../data/questionnaire";
import { customRoleOptionId, findRoleOption } from "../data/roleOptions";
import { fetchCapabilityEvidence, uploadResumeFile } from "../services/abilityApi";
import { fetchRoleGeneratedQuestionnaire } from "../services/questionnaireApi";
import { fetchRoleProfile } from "../services/ragApi";
import {
  createEmptyCapabilityProfile,
  mergeCapabilityProfile,
  normalizeRoleProfile,
  profileAverageScore,
} from "../services/profileMerge";
import type {
  ApiMeta,
  AiReportContent,
  CapabilityEvidenceGroup,
  CapabilityProfile,
  CapabilityReportRow,
  FlowView,
  ImprovementPlanSection,
  QuestionnaireMode,
  QuestionnaireAnswerPayload,
  RoleDimension,
  RoleCapabilityProfile,
} from "../types/profile";

const demoUserId = import.meta.env.VITE_CAPABILITY_STUDENT_ID || "demo_user_001";

interface AssessmentState {
  view: FlowView;
  currentQuestion: number;
  resumeText: string;
  targetRole: string;
  targetJd: string;
  assessmentId: string;
  selectedRoleOptionId: string;
  uploadedFileName: string;
  uploadStatus: string;
  error: string;
  isUploading: boolean;
  isAnalyzing: boolean;
  isGeneratingQuestionnaire: boolean;
  questionnaireMode: QuestionnaireMode;
  questionnaire: Record<string, number | null>;
  generatedQuestionnaireItems: typeof questionnaireItems;
  capabilityProfile: CapabilityProfile | null;
  roleProfile: RoleCapabilityProfile | null;
  reportContent: AiReportContent | null;
  evidence: CapabilityEvidenceGroup[];
  apiMeta: ApiMeta;
}

function createQuestionnaireState(items = questionnaireItems): Record<string, number | null> {
  return Object.fromEntries(items.map((item) => [item.id, null]));
}

function createInitialState(): AssessmentState {
  return {
    view: "start",
    currentQuestion: 0,
    resumeText: "",
    targetRole: "",
    targetJd: "",
    assessmentId: "",
    selectedRoleOptionId: "",
    uploadedFileName: "",
    uploadStatus: "",
    error: "",
    isUploading: false,
    isAnalyzing: false,
    isGeneratingQuestionnaire: false,
    questionnaireMode: "detailed",
    questionnaire: createQuestionnaireState(),
    generatedQuestionnaireItems: [],
    capabilityProfile: null,
    roleProfile: null,
    reportContent: null,
    evidence: [],
    apiMeta: {},
  };
}

function clampScore(value: unknown): number {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function clampConfidence(value: unknown): number {
  return Math.max(0, Math.min(1, Number((Number(value) || 0).toFixed(2))));
}

function normalizeReportContent(value: unknown): AiReportContent | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as AiReportContent;
  return {
    capability_details: Array.isArray(raw.capability_details) ? raw.capability_details : [],
    improvement_plan: Array.isArray(raw.improvement_plan) ? raw.improvement_plan : [],
  };
}

function buildDimensionReportRow(
  dimension: RoleDimension,
  profile: CapabilityProfile,
  reportContent: AiReportContent | null,
): CapabilityReportRow {
  const mappedKeys = dimension.mapped_capability_keys.length ? dimension.mapped_capability_keys : [capabilities[0].key];
  const entries = mappedKeys.map((key) => profile[key]).filter(Boolean);
  const reportDetail = (reportContent?.capability_details ?? []).find(
    (item) => item.role_dimension_id === dimension.dimension_id,
  );
  const score = clampScore(entries.reduce((sum, entry) => sum + Number(entry.score || 0), 0) / Math.max(entries.length, 1));
  const confidence = clampConfidence(
    entries.reduce((sum, entry) => sum + Number(entry.confidence || 0), 0) / Math.max(entries.length, 1),
  );
  const sources = [...new Set(entries.flatMap((entry) => entry.evidence_sources ?? []))];
  const summaries = entries.map((entry) => entry.evidence_summary).filter(Boolean).slice(0, 2);
  const advice = entries.map((entry) => entry.improvement_advice).filter(Boolean).slice(0, 2).join(" ");
  const primaryCapability = capabilityByKey(mappedKeys[0]);
  const required = clampScore(dimension.required_level);
  const gap = Math.max(0, required - score);

  return {
    ...primaryCapability,
    key: mappedKeys[0],
    dimension_id: dimension.dimension_id,
    label: dimension.label,
    short: dimension.label.length > 8 ? dimension.label.slice(0, 8) : dimension.label,
    description: dimension.description,
    mapped_capability_keys: mappedKeys,
    weight: Math.max(0, Math.min(1, Number(dimension.weight || 0))),
    score,
    confidence,
    evidence_sources: sources,
    evidence_summary: summaries.join(" ") || "当前输入中缺少该岗位维度的可解释证据。",
    improvement_advice: advice || dimension.improvement_direction,
    required,
    gap,
    surplus: Math.max(0, score - required),
    requirement_summary: dimension.description,
    evaluation_method: dimension.evaluation_method,
    questionnaire_focus: dimension.questionnaire_focus,
    knowledge_basis: dimension.knowledge_basis,
    improvement_direction: dimension.improvement_direction,
    priority_score: Math.round(gap * Math.max(0.05, Number(dimension.weight || 0)) * 100) / 100,
    source_completeness: sources.length >= 2 ? "证据较完整" : sources.length === 1 ? "证据单一" : "缺少个人证据",
    ai_role_application: reportDetail?.role_application,
    ai_personal_assessment: reportDetail?.personal_assessment,
    ai_improvement_advice: reportDetail?.improvement_advice,
  };
}

export function useAssessmentFlow() {
  const state = reactive<AssessmentState>(createInitialState());
  let pendingAdvanceTimer: number | null = null;

  const activeQuestionnaireItems = computed(() =>
    state.questionnaireMode === "quick"
      ? quickQuestionnaireItems
      : state.questionnaireMode === "role_generated"
        ? state.generatedQuestionnaireItems
        : questionnaireItems,
  );

  const completedQuestionnaireCount = computed(
    () => activeQuestionnaireItems.value.filter((item) => state.questionnaire[item.id] !== null).length,
  );

  const completionPercent = computed(() =>
    Math.round((completedQuestionnaireCount.value / activeQuestionnaireItems.value.length) * 100),
  );

  const currentItem = computed(() => activeQuestionnaireItems.value[state.currentQuestion] ?? activeQuestionnaireItems.value[0]);
  const currentCapability = computed(() => capabilityByKey(currentItem.value.capabilityKey));
  const currentAnswer = computed(() => state.questionnaire[currentItem.value.id]);
  const quizPercent = computed(() =>
    Math.round(((state.currentQuestion + 1) / activeQuestionnaireItems.value.length) * 100),
  );
  const questionnaireTotal = computed(() => activeQuestionnaireItems.value.length);
  const questionnaireModeLabel = computed(() => {
    if (state.questionnaireMode === "quick") return "快速模式";
    if (state.questionnaireMode === "role_generated") return "AI 岗位问卷";
    return "详细模式";
  });

  const capabilityProfile = computed(() => state.capabilityProfile ?? createEmptyCapabilityProfile());

  const capabilityRows = computed<CapabilityReportRow[]>(() =>
    (state.roleProfile?.role_dimensions ?? [])
      .map((dimension) => buildDimensionReportRow(dimension, capabilityProfile.value, state.reportContent))
      .sort((a, b) => b.priority_score - a.priority_score || b.required - a.required),
  );

  const topStrengths = computed(() =>
    [...capabilityRows.value].sort((a, b) => b.surplus - a.surplus || b.score - a.score).slice(0, 3),
  );

  const topGaps = computed(() => [...capabilityRows.value].sort((a, b) => b.priority_score - a.priority_score).slice(0, 3));

  const overallScore = computed(() => {
    if (!state.capabilityProfile || capabilityRows.value.length === 0) return profileAverageScore(capabilityProfile.value);
    const totalWeight = capabilityRows.value.reduce((sum, item) => sum + (item.weight || 1), 0) || 1;
    return clampScore(capabilityRows.value.reduce((sum, item) => sum + item.score * (item.weight || 1), 0) / totalWeight);
  });

  const radarAxes = computed(() =>
    capabilityRows.value.map((row) => ({
      key: row.dimension_id,
      label: row.short || row.label,
      mappedCapabilityKeys: row.mapped_capability_keys,
      userScore: state.capabilityProfile ? row.score : undefined,
      roleScore: row.required,
    })),
  );

  const improvementPlan = computed<ImprovementPlanSection[]>(() => state.reportContent?.improvement_plan ?? []);

  const debugJson = computed(() =>
    JSON.stringify(
      {
        user_id: demoUserId,
        assessment_id: state.assessmentId,
        target_role: state.targetRole,
        generated_at: new Date().toISOString(),
        capability_profile: state.capabilityProfile,
        role_capability_profile: state.roleProfile,
        report_dimensions: capabilityRows.value,
        report_content: state.reportContent,
        improvement_plan: improvementPlan.value,
        api_meta: state.apiMeta,
      },
      null,
      2,
    ),
  );

  function setView(view: FlowView) {
    state.view = view;
    state.error = "";
  }

  function setError(message: string, view: FlowView = state.view) {
    state.error = message;
    state.view = view;
    state.isUploading = false;
    state.isAnalyzing = false;
    state.isGeneratingQuestionnaire = false;
  }

  function validateIntake(): string {
    if (!state.resumeText.trim()) return "请上传或粘贴一份文字版简历。";
    if (!state.selectedRoleOptionId) return "请选择一个心仪岗位，或选择其他后填写岗位信息。";
    if (!state.targetRole.trim()) return "请填写心仪职业。";
    if (state.selectedRoleOptionId === customRoleOptionId && !state.targetJd.trim()) {
      return "选择其他岗位时，请填写详细 JD。";
    }
    return "";
  }

  function validateQuestionnaire(): string {
    const missingIndex = activeQuestionnaireItems.value.findIndex((item) => state.questionnaire[item.id] === null);
    if (missingIndex >= 0) {
      state.currentQuestion = missingIndex;
      return `还有 ${activeQuestionnaireItems.value.length - completedQuestionnaireCount.value} 题未完成，请先补完第 ${missingIndex + 1} 题。`;
    }
    return "";
  }

  function questionnairePayload(): QuestionnaireAnswerPayload[] {
    return activeQuestionnaireItems.value.map((item) => ({
      id: item.id,
      capability_key: item.capabilityKey,
      role_dimension_id: item.roleDimensionId,
      indicator: item.indicator,
      text: item.text,
      score: Number(state.questionnaire[item.id] ?? 0),
      reverse: item.reverse,
    }));
  }

  async function handleResumeUpload(file: File) {
    state.isUploading = true;
    state.error = "";
    state.uploadStatus = `正在解析 ${file.name}`;
    try {
      const result = await uploadResumeFile(file);
      state.resumeText = result.text;
      state.uploadedFileName = result.file_name;
      state.uploadStatus = `已解析 ${result.file_name}`;
    } catch (error) {
      setError(error instanceof Error ? error.message : "简历解析失败。", "intake");
    } finally {
      state.isUploading = false;
    }
  }

  function selectRoleOption(optionId: string) {
    state.selectedRoleOptionId = optionId;
    state.error = "";
    if (optionId === customRoleOptionId) {
      state.targetRole = "";
      state.targetJd = "";
      return;
    }

    const option = findRoleOption(optionId);
    if (option) {
      state.targetRole = option.roleName;
      state.targetJd = option.jdText;
    }
  }

  async function continueFromIntake() {
    const error = validateIntake();
    if (error) {
      setError(error, "intake");
      return;
    }
    state.view = "analyzing";
    state.error = "";
    state.isAnalyzing = true;
    try {
      await generateRoleProfile();
      state.view = "questionnairePrompt";
    } catch (error) {
      setError(
        `无法生成岗位能力模型：${error instanceof Error ? error.message : "服务暂时不可用"}。请确认 Capability API 已启动，并已配置 DEEPSEEK_API_KEY。`,
        "error",
      );
    } finally {
      state.isAnalyzing = false;
    }
  }

  async function beginQuestionnaire(mode: QuestionnaireMode = "detailed") {
    if (mode === "role_generated") {
      state.error = "";
      state.isGeneratingQuestionnaire = true;
      try {
        const generatedItems = await fetchRoleGeneratedQuestionnaire({
          targetRole: state.targetRole,
          targetJd: state.targetJd,
          roleDimensions: state.roleProfile?.role_dimensions ?? [],
          questionCount: 15,
        });
        state.generatedQuestionnaireItems = generatedItems;
        state.questionnaireMode = mode;
        state.questionnaire = createQuestionnaireState(generatedItems);
        state.currentQuestion = 0;
        setView("quiz");
      } catch (error) {
        setError(
          `无法生成 AI 岗位问卷：${error instanceof Error ? error.message : "服务暂时不可用"}。请确认 Capability API、DeepSeek key 和 SWEBOK 知识库索引已准备好。`,
          "questionnairePrompt",
        );
      } finally {
        state.isGeneratingQuestionnaire = false;
      }
      return;
    }

    state.questionnaireMode = mode;
    state.questionnaire = createQuestionnaireState(questionnaireItems);
    state.currentQuestion = 0;
    setView("quiz");
  }

  async function generateRoleProfile() {
    const roleResult = await fetchRoleProfile({
      userId: demoUserId,
      resumeText: state.resumeText,
      targetRole: state.targetRole,
      targetJd: state.targetJd,
    });

    state.assessmentId = roleResult.assessment_id ?? state.assessmentId;
    state.roleProfile = normalizeRoleProfile(roleResult.profile ?? roleResult.role_profile ?? {}, state.targetRole);
    state.apiMeta = {
      ...state.apiMeta,
      role: {
        model: roleResult.deepseek_model ?? roleResult.role_api_meta?.deepseek_model,
        elapsed_seconds: roleResult.elapsed_seconds ?? roleResult.role_api_meta?.elapsed_seconds,
        retrieved_chunks: roleResult.retrieved_chunks ?? roleResult.role_api_meta?.retrieved_chunks ?? [],
      },
    };
  }

  async function goToProfileWithoutQuiz() {
    const error = validateIntake();
    if (error) {
      setError(error, "intake");
      return;
    }

    state.view = "analyzing";
    state.error = "";
    state.isAnalyzing = true;
    try {
      if (!state.assessmentId || !state.roleProfile) {
        await generateRoleProfile();
      }
      state.view = "profile";
    } catch (error) {
      setError(
        `无法生成理想岗位雷达：${error instanceof Error ? error.message : "服务暂时不可用"}。请确认 Capability API 已启动，并已配置 DEEPSEEK_API_KEY。`,
        "error",
      );
    } finally {
      state.isAnalyzing = false;
    }
  }

  function selectAnswer(score: number) {
    const selectedIndex = state.currentQuestion;
    const selectedItemId = currentItem.value.id;
    state.questionnaire[currentItem.value.id] = score;
    state.error = "";
    if (pendingAdvanceTimer !== null) {
      window.clearTimeout(pendingAdvanceTimer);
      pendingAdvanceTimer = null;
    }
    if (selectedIndex < activeQuestionnaireItems.value.length - 1) {
      pendingAdvanceTimer = window.setTimeout(() => {
        pendingAdvanceTimer = null;
        if (state.currentQuestion === selectedIndex && state.questionnaire[selectedItemId] !== null) {
          state.currentQuestion = selectedIndex + 1;
        }
      }, 160);
    }
  }

  function previousQuestion() {
    if (pendingAdvanceTimer !== null) {
      window.clearTimeout(pendingAdvanceTimer);
      pendingAdvanceTimer = null;
    }
    state.currentQuestion = Math.max(0, state.currentQuestion - 1);
    state.error = "";
  }

  function nextQuestion() {
    if (pendingAdvanceTimer !== null) {
      window.clearTimeout(pendingAdvanceTimer);
      pendingAdvanceTimer = null;
    }
    state.currentQuestion = Math.min(activeQuestionnaireItems.value.length - 1, state.currentQuestion + 1);
    state.error = "";
  }

  function goToQuestion(index: number) {
    if (pendingAdvanceTimer !== null) {
      window.clearTimeout(pendingAdvanceTimer);
      pendingAdvanceTimer = null;
    }
    state.currentQuestion = Math.max(0, Math.min(activeQuestionnaireItems.value.length - 1, index));
    state.error = "";
  }

  async function submitAssessment() {
    const questionnaireError = validateQuestionnaire();
    if (questionnaireError) {
      setError(questionnaireError, "quiz");
      return;
    }

    state.view = "analyzing";
    state.error = "";
    state.isAnalyzing = true;
    try {
      if (!state.assessmentId || !state.roleProfile) {
        await generateRoleProfile();
      }
      const capabilityResult = await fetchCapabilityEvidence({
        userId: demoUserId,
        assessmentId: state.assessmentId,
        resumeText: state.resumeText,
        targetRole: state.targetRole,
        questionnaireAnswers: questionnairePayload(),
      });

      state.assessmentId = capabilityResult.assessment_id ?? state.assessmentId;
      state.evidence = capabilityResult.evidence;
      state.capabilityProfile = mergeCapabilityProfile(capabilityResult.evidence);
      state.reportContent = normalizeReportContent(capabilityResult.ability_api_meta?.report_content);
      state.apiMeta = {
        ...state.apiMeta,
        ability: {
          model: capabilityResult.deepseek_model ?? capabilityResult.ability_api_meta?.deepseek_model,
          elapsed_seconds: capabilityResult.elapsed_seconds ?? capabilityResult.ability_api_meta?.elapsed_seconds,
          status: capabilityResult.llm_status ?? capabilityResult.ability_api_meta?.llm_status,
          report_content: state.reportContent ?? undefined,
        },
      };
      state.view = "profile";
    } catch (error) {
      setError(
        `无法生成报告：${error instanceof Error ? error.message : "服务暂时不可用"}。请确认 Capability API 已启动，并已配置 DEEPSEEK_API_KEY。`,
        "error",
      );
    } finally {
      state.isAnalyzing = false;
    }
  }

  function restart() {
    Object.assign(state, createInitialState());
  }

  return {
    state,
    completedQuestionnaireCount,
    completionPercent,
    activeQuestionnaireItems,
    currentItem,
    currentCapability,
    currentAnswer,
    quizPercent,
    questionnaireTotal,
    questionnaireModeLabel,
    capabilityRows,
    topStrengths,
    topGaps,
    overallScore,
    radarAxes,
    improvementPlan,
    debugJson,
    setView,
    selectRoleOption,
    continueFromIntake,
    beginQuestionnaire,
    goToProfileWithoutQuiz,
    handleResumeUpload,
    selectAnswer,
    previousQuestion,
    nextQuestion,
    goToQuestion,
    submitAssessment,
    restart,
  };
}
