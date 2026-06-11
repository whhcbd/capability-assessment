import { computed, reactive } from "vue";
import { capabilities, capabilityByKey } from "../data/capabilities";
import { questionnaireItems } from "../data/questionnaire";
import { customRoleOptionId, findRoleOption } from "../data/roleOptions";
import { fetchCapabilityEvidence, uploadResumeFile } from "../services/abilityApi";
import { fetchRoleProfile } from "../services/ragApi";
import {
  createEmptyCapabilityProfile,
  mergeCapabilityProfile,
  normalizeRoleProfile,
  profileAverageScore,
} from "../services/profileMerge";
import type {
  ApiMeta,
  CapabilityEvidenceGroup,
  CapabilityProfile,
  CapabilityReportRow,
  FlowView,
  QuestionnaireAnswerPayload,
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
  questionnaire: Record<string, number | null>;
  capabilityProfile: CapabilityProfile | null;
  roleProfile: RoleCapabilityProfile | null;
  evidence: CapabilityEvidenceGroup[];
  apiMeta: ApiMeta;
}

function createQuestionnaireState(): Record<string, number | null> {
  return Object.fromEntries(questionnaireItems.map((item) => [item.id, null]));
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
    questionnaire: createQuestionnaireState(),
    capabilityProfile: null,
    roleProfile: null,
    evidence: [],
    apiMeta: {},
  };
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    resume_text: "简历证据",
    self_assessment: "问卷自评",
    questionnaire: "问卷自评",
  };
  return labels[source] ?? source;
}

export function useAssessmentFlow() {
  const state = reactive<AssessmentState>(createInitialState());

  const completedQuestionnaireCount = computed(
    () => Object.values(state.questionnaire).filter((value) => value !== null).length,
  );

  const completionPercent = computed(() =>
    Math.round((completedQuestionnaireCount.value / questionnaireItems.length) * 100),
  );

  const currentItem = computed(() => questionnaireItems[state.currentQuestion]);
  const currentCapability = computed(() => capabilityByKey(currentItem.value.capabilityKey));
  const currentAnswer = computed(() => state.questionnaire[currentItem.value.id]);
  const quizPercent = computed(() => Math.round(((state.currentQuestion + 1) / questionnaireItems.length) * 100));

  const capabilityProfile = computed(() => state.capabilityProfile ?? createEmptyCapabilityProfile());

  const capabilityRows = computed<CapabilityReportRow[]>(() => {
    const requirements = state.roleProfile?.requirements;
    return capabilities
      .map((capability) => {
        const user = capabilityProfile.value[capability.key];
        const role = requirements?.[capability.key];
        const required = Math.max(0, Math.min(100, Math.round(Number(role?.required_level ?? 0))));
        const score = Math.max(0, Math.min(100, Math.round(Number(user.score ?? 0))));
        return {
          ...capability,
          score,
          confidence: Math.max(0, Math.min(1, Number(user.confidence ?? 0))),
          evidence_sources: user.evidence_sources ?? [],
          evidence_summary: user.evidence_summary || "暂无证据摘要。",
          required,
          gap: Math.max(0, required - score),
          surplus: Math.max(0, score - required),
          requirement_summary: role?.requirement_summary ?? "暂无岗位要求摘要。",
        };
      })
      .sort((a, b) => b.required - a.required);
  });

  const topStrengths = computed(() =>
    [...capabilityRows.value].sort((a, b) => b.surplus - a.surplus || b.score - a.score).slice(0, 3),
  );

  const topGaps = computed(() =>
    [...capabilityRows.value].sort((a, b) => b.gap - a.gap || b.required - a.required).slice(0, 3),
  );

  const overallScore = computed(() => profileAverageScore(capabilityProfile.value));

  const debugJson = computed(() =>
    JSON.stringify(
      {
        user_id: demoUserId,
        assessment_id: state.assessmentId,
        target_role: state.targetRole,
        generated_at: new Date().toISOString(),
        capability_profile: state.capabilityProfile,
        role_capability_profile: state.roleProfile,
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
    const missingIndex = questionnaireItems.findIndex((item) => state.questionnaire[item.id] === null);
    if (missingIndex >= 0) {
      state.currentQuestion = missingIndex;
      return `请先完成第 ${missingIndex + 1} 题。`;
    }
    return "";
  }

  function questionnairePayload(): QuestionnaireAnswerPayload[] {
    return questionnaireItems.map((item) => ({
      id: item.id,
      capability_key: item.capabilityKey,
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

  function continueFromIntake() {
    const error = validateIntake();
    if (error) {
      setError(error, "intake");
      return;
    }
    setView("questionnairePrompt");
  }

  function beginQuestionnaire() {
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
      await generateRoleProfile();
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
    state.questionnaire[currentItem.value.id] = score;
    state.error = "";
    if (state.currentQuestion < questionnaireItems.length - 1) {
      window.setTimeout(() => {
        state.currentQuestion += 1;
      }, 160);
    }
  }

  function previousQuestion() {
    state.currentQuestion = Math.max(0, state.currentQuestion - 1);
    state.error = "";
  }

  function nextQuestion() {
    if (state.questionnaire[currentItem.value.id] === null) {
      setError("请选择一个答案后再继续。", "quiz");
      return;
    }
    state.currentQuestion = Math.min(questionnaireItems.length - 1, state.currentQuestion + 1);
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
      state.apiMeta = {
        ...state.apiMeta,
        ability: {
          model: capabilityResult.deepseek_model ?? capabilityResult.ability_api_meta?.deepseek_model,
          elapsed_seconds: capabilityResult.elapsed_seconds ?? capabilityResult.ability_api_meta?.elapsed_seconds,
          status: capabilityResult.llm_status ?? capabilityResult.ability_api_meta?.llm_status,
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
    currentItem,
    currentCapability,
    currentAnswer,
    quizPercent,
    capabilityRows,
    topStrengths,
    topGaps,
    overallScore,
    debugJson,
    sourceLabel,
    setView,
    selectRoleOption,
    continueFromIntake,
    beginQuestionnaire,
    goToProfileWithoutQuiz,
    handleResumeUpload,
    selectAnswer,
    previousQuestion,
    nextQuestion,
    submitAssessment,
    restart,
  };
}
