export type CapabilityKey =
  | "communication_expression"
  | "logical_analysis"
  | "learning_adaptability"
  | "execution_ownership"
  | "collaboration_leadership"
  | "self_awareness_motivation"
  | "data_digital_literacy"
  | "business_industry_understanding";

export interface CapabilityInfo {
  key: CapabilityKey;
  label: string;
  short: string;
  description: string;
}

export interface QuestionnaireItem {
  id: string;
  capabilityKey: CapabilityKey;
  indicator: string;
  evidenceType: string;
  text: string;
  reverse: boolean;
}

export interface QuestionnaireAnswerPayload {
  id: string;
  capability_key: CapabilityKey;
  indicator: string;
  text: string;
  score: number;
  reverse: boolean;
}

export interface CapabilityEvidenceItem {
  capability_key: CapabilityKey;
  score: number;
  confidence: number;
  evidence_summary: string;
}

export interface CapabilityEvidenceGroup {
  source_type: "resume_text" | "self_assessment" | "questionnaire" | string;
  source_id: string;
  capability_evidence: CapabilityEvidenceItem[];
}

export interface CapabilityProfileEntry {
  score: number;
  confidence: number;
  evidence_sources: string[];
  evidence_summary: string;
}

export type CapabilityProfile = Record<CapabilityKey, CapabilityProfileEntry>;

export interface RoleRequirement {
  required_level: number;
  weight: number;
  requirement_summary: string;
}

export type RoleRequirements = Record<CapabilityKey, RoleRequirement>;

export interface RoleCapabilityProfile {
  role_id: string;
  role_name: string;
  profile_version: string;
  source_type: string;
  rag_status: string;
  source_refs: string[];
  requirements: RoleRequirements;
}

export interface AbilityEvidenceResponse {
  assessment_id?: string;
  student_id?: string;
  status?: string;
  evidence: CapabilityEvidenceGroup[];
  capability_profile?: Partial<CapabilityProfile>;
  ability_api_meta?: {
    deepseek_model?: string;
    validation_errors?: string[];
    elapsed_seconds?: number;
    llm_status?: string;
  };
  deepseek_model?: string;
  validation_errors?: string[];
  elapsed_seconds?: number;
  llm_status?: string;
  error?: string;
}

export interface RoleProfileResponse {
  assessment_id?: string;
  student_id?: string;
  status?: string;
  profile?: Partial<RoleCapabilityProfile>;
  role_profile?: Partial<RoleCapabilityProfile>;
  role_api_meta?: {
    deepseek_model?: string;
    retrieved_chunks?: unknown[];
    validation_errors?: string[];
    elapsed_seconds?: number;
  };
  retrieved_chunks?: unknown[];
  deepseek_model?: string;
  validation_errors?: string[];
  elapsed_seconds?: number;
  error?: string;
}

export interface ResumeTextResponse {
  file_name?: string;
  file_type?: string;
  text?: string;
  extraction_status?: "extracted" | "failed" | string;
  error?: string;
}

export interface ApiMeta {
  ability?: {
    model?: string;
    elapsed_seconds?: number;
    status?: string;
  };
  role?: {
    model?: string;
    elapsed_seconds?: number;
    retrieved_chunks?: unknown[];
  };
}

export type FlowView = "start" | "intake" | "questionnairePrompt" | "quiz" | "analyzing" | "profile" | "error";

export interface CapabilityReportRow extends CapabilityInfo {
  score: number;
  confidence: number;
  evidence_sources: string[];
  evidence_summary: string;
  required: number;
  gap: number;
  surplus: number;
  requirement_summary: string;
}
