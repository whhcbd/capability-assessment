from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RoleProfileRequest(BaseModel):
    resume_text: str = Field(min_length=1)
    target_role: str = Field(min_length=1)
    target_jd: str = ""
    role_id: str = "custom_target_role"
    top_k: int = Field(default=5, ge=1, le=10)
    timeout: int = Field(default=120, ge=5, le=180)
    retries: int = Field(default=1, ge=0, le=3)


class QuestionnaireAnswer(BaseModel):
    id: str
    capability_key: str
    indicator: str = ""
    text: str = ""
    score: int = Field(ge=0, le=5)
    reverse: bool = False


class CapabilityEvidenceRequest(BaseModel):
    assessment_id: str
    questionnaire_answers: list[QuestionnaireAnswer] = Field(min_length=1)
    timeout: int = Field(default=120, ge=5, le=180)
    retries: int = Field(default=1, ge=0, le=3)


class RoleGeneratedQuestionnaireRequest(BaseModel):
    target_role: str = Field(min_length=1)
    target_jd: str = ""
    role_id: str = "custom_target_role"
    question_count: int = Field(default=15, ge=1, le=20)
    top_k: int = Field(default=6, ge=1, le=10)
    timeout: int = Field(default=120, ge=5, le=180)
    retries: int = Field(default=1, ge=0, le=3)


class GeneratedQuestionnaireItem(BaseModel):
    id: str
    capability_key: str
    indicator: str
    evidence_type: str
    text: str
    reverse: bool = False


class RoleGeneratedQuestionnaireResponse(BaseModel):
    role_id: str
    target_role: str
    target_jd: str
    questionnaire_items: list[GeneratedQuestionnaireItem]
    source_refs: list[str] = []
    questionnaire_api_meta: dict[str, Any] | None = None


class AssessmentResponse(BaseModel):
    assessment_id: str
    student_id: str
    status: str
    target_role: str
    target_jd: str
    role_profile: dict[str, Any] | None = None
    role_api_meta: dict[str, Any] | None = None
    evidence: list[dict[str, Any]] | None = None
    capability_profile: dict[str, Any] | None = None
    ability_api_meta: dict[str, Any] | None = None
    questionnaire_answers: list[dict[str, Any]] | None = None
    created_at: str
    updated_at: str
    completed_at: str | None = None


class ResumeTextResponse(BaseModel):
    file_name: str
    file_type: str
    text: str
    extraction_status: str


class ApiErrorResponse(BaseModel):
    error: str
