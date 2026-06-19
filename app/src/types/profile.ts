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
  roleDimensionId?: string;
  indicator: string;
  evidenceType: string;
  text: string;
  reverse: boolean;
}

export interface QuestionnaireAnswerPayload {
  id: string;
  capability_key: CapabilityKey;
  role_dimension_id?: string;
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
  improvement_advice?: string;
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
  improvement_advice?: string;
}

export type CapabilityProfile = Record<CapabilityKey, CapabilityProfileEntry>;

export interface RoleRequirement {
  required_level: number;
  weight: number;
  requirement_summary: string;
}

export type RoleRequirements = Record<CapabilityKey, RoleRequirement>;

export interface RoleDimension {
  dimension_id: string;
  label: string;
  description: string;
  required_level: number;
  weight: number;
  mapped_capability_keys: CapabilityKey[];
  evaluation_method: string;
  questionnaire_focus: string;
  knowledge_basis: string;
  improvement_direction: string;
}

export interface RoleCapabilityProfile {
  role_id: string;
  role_name: string;
  profile_version: string;
  source_type: string;
  rag_status: string;
  source_refs: string[];
  role_dimensions: RoleDimension[];
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
    report_content?: AiReportContent;
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

export interface RoleGeneratedQuestionnaireItem {
  id: string;
  role_dimension_id?: string;
  capability_key: CapabilityKey;
  indicator: string;
  evidence_type: string;
  text: string;
  reverse: boolean;
}

export interface RoleGeneratedQuestionnaireResponse {
  role_id?: string;
  target_role?: string;
  target_jd?: string;
  questionnaire_items?: RoleGeneratedQuestionnaireItem[];
  source_refs?: string[];
  questionnaire_api_meta?: {
    deepseek_model?: string;
    retrieved_chunks?: unknown[];
    validation_errors?: string[];
    elapsed_seconds?: number;
    llm_status?: string;
  };
  error?: string;
}

export interface ApiMeta {
  ability?: {
    model?: string;
    elapsed_seconds?: number;
    status?: string;
    report_content?: AiReportContent;
  };
  role?: {
    model?: string;
    elapsed_seconds?: number;
    retrieved_chunks?: unknown[];
  };
}

export type QuestionnaireMode = "quick" | "detailed" | "role_generated";

export type FlowView = "start" | "intake" | "questionnairePrompt" | "quiz" | "analyzing" | "profile" | "error";

export interface CapabilityReportRow extends CapabilityInfo {
  dimension_id: string;
  description: string;
  mapped_capability_keys: CapabilityKey[];
  weight: number;
  score: number;
  confidence: number;
  evidence_sources: string[];
  evidence_summary: string;
  improvement_advice?: string;
  required: number;
  gap: number;
  surplus: number;
  requirement_summary: string;
  evaluation_method: string;
  questionnaire_focus: string;
  knowledge_basis: string;
  improvement_direction: string;
  priority_score: number;
  source_completeness: string;
  ai_role_application?: string;
  ai_personal_assessment?: string;
  ai_improvement_advice?: string;
}

export interface ImprovementPlanSection {
  title: string;
  items: string[];
}

export interface AiCapabilityDetail {
  role_dimension_id: string;
  role_application: string;
  personal_assessment: string;
  improvement_advice: string;
}

export interface AiReportContent {
  capability_details?: AiCapabilityDetail[];
  improvement_plan?: ImprovementPlanSection[];
}

export interface RadarAxis {
  key: string;
  label: string;
  mappedCapabilityKeys: CapabilityKey[];
  userScore?: number;
  roleScore?: number;
}
