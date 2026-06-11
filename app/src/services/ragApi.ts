import type { RoleProfileResponse } from "../types/profile";

const capabilityApiBaseUrl =
  import.meta.env.VITE_CAPABILITY_API_BASE_URL ||
  import.meta.env.VITE_RAG_API_BASE_URL ||
  "http://127.0.0.1:8770";
const studentId = import.meta.env.VITE_CAPABILITY_STUDENT_ID || "demo_user_001";

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

export async function fetchRoleProfile(input: {
  userId: string;
  resumeText: string;
  targetRole: string;
  targetJd: string;
}): Promise<RoleProfileResponse> {
  const targetJd = [input.targetRole, input.targetJd].filter((value) => value.trim()).join("\n\n");
  const response = await fetch(`${capabilityApiBaseUrl}/assessments/role-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Student-Id": input.userId || studentId,
    },
    body: JSON.stringify({
      resume_text: input.resumeText,
      role_id: "custom_target_role",
      target_role: input.targetRole,
      target_jd: targetJd,
      top_k: 5,
      timeout: 120,
      retries: 1,
    }),
  });
  const payload = (await response.json()) as RoleProfileResponse & ErrorPayload;

  if (!response.ok || payload.error) {
    throw new Error(errorMessageFromResponse(payload, `RAG API HTTP ${response.status}`));
  }
  if (!payload.profile && !payload.role_profile) {
    throw new Error("RAG API 没有返回岗位能力画像。");
  }

  return {
    ...payload,
    profile: payload.profile ?? payload.role_profile,
    deepseek_model: payload.deepseek_model ?? payload.role_api_meta?.deepseek_model,
    retrieved_chunks: payload.retrieved_chunks ?? payload.role_api_meta?.retrieved_chunks,
    validation_errors: payload.validation_errors ?? payload.role_api_meta?.validation_errors,
    elapsed_seconds: payload.elapsed_seconds ?? payload.role_api_meta?.elapsed_seconds,
  };
}
