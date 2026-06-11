import type {
  AbilityEvidenceResponse,
  QuestionnaireAnswerPayload,
  ResumeTextResponse,
} from "../types/profile";

const capabilityApiBaseUrl =
  import.meta.env.VITE_CAPABILITY_API_BASE_URL ||
  import.meta.env.VITE_ABILITY_API_BASE_URL ||
  "http://127.0.0.1:8770";
const studentId = import.meta.env.VITE_CAPABILITY_STUDENT_ID || "demo_user_001";

type ErrorPayload = {
  error?: string;
  detail?: string | { error?: string; extraction_status?: string };
};

function errorMessageFromResponse(payload: ErrorPayload, fallback: string): string {
  if (payload.error?.trim()) return payload.error.trim();
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail.trim();
  if (typeof payload.detail === "object" && payload.detail.error?.trim()) return payload.detail.error.trim();
  return fallback;
}

export async function uploadResumeFile(
  file: File,
): Promise<Required<Pick<ResumeTextResponse, "file_name" | "file_type" | "text" | "extraction_status">>> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${capabilityApiBaseUrl}/resume-text`, {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as ResumeTextResponse & ErrorPayload;

  if (!response.ok || payload.error) {
    throw new Error(errorMessageFromResponse(payload, `简历解析失败：HTTP ${response.status}`));
  }
  if (!payload.text?.trim()) {
    throw new Error("未能提取到简历正文，请粘贴文字版简历。");
  }

  return {
    file_name: payload.file_name || file.name,
    file_type: payload.file_type || file.name.split(".").pop() || "unknown",
    text: payload.text,
    extraction_status: payload.extraction_status || "extracted",
  };
}

export async function fetchCapabilityEvidence(input: {
  userId: string;
  assessmentId: string;
  resumeText: string;
  targetRole: string;
  questionnaireAnswers: QuestionnaireAnswerPayload[];
}): Promise<AbilityEvidenceResponse> {
  const response = await fetch(`${capabilityApiBaseUrl}/assessments/capability-evidence`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Student-Id": input.userId || studentId,
    },
    body: JSON.stringify({
      assessment_id: input.assessmentId,
      questionnaire_answers: input.questionnaireAnswers,
      timeout: 120,
      retries: 1,
    }),
  });
  const payload = (await response.json()) as AbilityEvidenceResponse & ErrorPayload;

  if (!response.ok || payload.error) {
    throw new Error(errorMessageFromResponse(payload, `Ability API HTTP ${response.status}`));
  }
  if (!Array.isArray(payload.evidence) || payload.evidence.length === 0) {
    throw new Error("Ability API 没有返回能力证据。");
  }

  return payload;
}
