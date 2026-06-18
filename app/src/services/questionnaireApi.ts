import type {
  QuestionnaireItem,
  RoleDimension,
  RoleGeneratedQuestionnaireResponse,
} from "../types/profile";

const capabilityApiBaseUrl = import.meta.env.VITE_CAPABILITY_API_BASE_URL || "http://127.0.0.1:8770";

type ErrorPayload = {
  error?: string;
  detail?: string | { error?: string };
};

function errorMessageFromResponse(payload: ErrorPayload, fallback: string): string {
  if (payload.error?.trim()) return payload.error.trim();
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail.trim();
  if (typeof payload.detail === "object" && payload.detail.error?.trim()) return payload.detail.error.trim();
  return fallback;
}

export async function fetchRoleGeneratedQuestionnaire(input: {
  targetRole: string;
  targetJd: string;
  roleDimensions?: RoleDimension[];
  questionCount?: number;
}): Promise<QuestionnaireItem[]> {
  const response = await fetch(`${capabilityApiBaseUrl}/questionnaires/role-generated`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target_role: input.targetRole,
      target_jd: input.targetJd,
      role_id: "internet_product_intern",
      role_dimensions: input.roleDimensions ?? [],
      question_count: input.questionCount ?? 15,
      top_k: 6,
      timeout: 120,
      retries: 1,
    }),
  });
  const payload = (await response.json()) as RoleGeneratedQuestionnaireResponse & ErrorPayload;

  if (!response.ok || payload.error) {
    throw new Error(errorMessageFromResponse(payload, `AI 问卷生成失败：HTTP ${response.status}`));
  }
  if (!Array.isArray(payload.questionnaire_items) || payload.questionnaire_items.length === 0) {
    throw new Error("AI 问卷接口没有返回题目。");
  }

  return payload.questionnaire_items.map((item) => ({
    id: item.id,
    capabilityKey: item.capability_key,
    roleDimensionId: item.role_dimension_id,
    indicator: item.indicator,
    evidenceType: item.evidence_type,
    text: item.text,
    reverse: item.reverse,
  }));
}
