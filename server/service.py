from __future__ import annotations

from typing import Any

from .profile_merge import merge_capability_profile
from .repository import AssessmentRepository
from .schemas import CapabilityEvidenceRequest, RoleGeneratedQuestionnaireRequest, RoleProfileRequest
from .script_adapters import build_capability_evidence, build_role_profile, build_role_questionnaire


class AssessmentService:
    def __init__(self, repository: AssessmentRepository) -> None:
        self.repository = repository

    def create_role_profile(
        self,
        *,
        student_id: str,
        request: RoleProfileRequest,
    ) -> dict[str, Any]:
        result = build_role_profile(
            role_id=request.role_id,
            role_name=request.target_role,
            jd_text=request.target_jd or request.target_role,
            top_k=request.top_k,
            timeout=request.timeout,
            retries=request.retries,
        )
        role_api_meta = {
            "deepseek_model": result.get("deepseek_model"),
            "retrieved_chunks": result.get("retrieved_chunks") or [],
            "retrieval_query": result.get("retrieval_query") or {},
            "validation_errors": result.get("validation_errors") or [],
            "elapsed_seconds": result.get("elapsed_seconds"),
        }
        return self.repository.create_role_session(
            student_id=student_id,
            resume_text=request.resume_text.strip(),
            target_role=request.target_role.strip(),
            target_jd=request.target_jd.strip(),
            role_profile=result["profile"],
            role_api_meta=role_api_meta,
        )

    def complete_questionnaire(
        self,
        *,
        student_id: str,
        request: CapabilityEvidenceRequest,
    ) -> dict[str, Any]:
        session = self.repository.get_by_id(request.assessment_id, student_id=student_id)
        if session is None:
            raise ValueError("Assessment session not found for this student.")

        answers = [answer.model_dump() for answer in request.questionnaire_answers]
        role_requirements = {}
        role_dimensions = []
        if isinstance(session.get("role_profile"), dict):
            role_requirements = session["role_profile"].get("requirements") or {}
            role_dimensions = session["role_profile"].get("role_dimensions") or []
        result = build_capability_evidence(
            user_id=student_id,
            resume_text=session["resume_text"],
            target_role=session["target_role"],
            questionnaire_answers=answers,
            timeout=request.timeout,
            retries=request.retries,
            role_requirements=role_requirements if isinstance(role_requirements, dict) else {},
            role_dimensions=role_dimensions if isinstance(role_dimensions, list) else [],
        )
        evidence = result["evidence"]
        capability_profile = merge_capability_profile(evidence)
        ability_api_meta = {
            "deepseek_model": result.get("deepseek_model"),
            "validation_errors": result.get("validation_errors") or [],
            "elapsed_seconds": result.get("elapsed_seconds"),
            "llm_status": result.get("llm_status"),
        }
        return self.repository.complete_assessment(
            assessment_id=request.assessment_id,
            student_id=student_id,
            evidence=evidence,
            capability_profile=capability_profile,
            ability_api_meta=ability_api_meta,
            questionnaire_answers=answers,
        )

    def generate_role_questionnaire(
        self,
        *,
        request: RoleGeneratedQuestionnaireRequest,
    ) -> dict[str, Any]:
        result = build_role_questionnaire(
            role_name=request.target_role.strip(),
            jd_text=request.target_jd.strip() or request.target_role.strip(),
            question_count=request.question_count,
            top_k=request.top_k,
            timeout=request.timeout,
            retries=request.retries,
            role_dimensions=request.role_dimensions,
        )
        return {
            "role_id": request.role_id,
            "target_role": request.target_role.strip(),
            "target_jd": request.target_jd.strip(),
            "questionnaire_items": result["questionnaire_items"],
            "source_refs": result.get("source_refs") or [],
            "questionnaire_api_meta": {
                "deepseek_model": result.get("deepseek_model"),
                "retrieved_chunks": result.get("retrieved_chunks") or [],
                "retrieval_query": result.get("retrieval_query") or {},
                "validation_errors": result.get("validation_errors") or [],
                "elapsed_seconds": result.get("elapsed_seconds"),
                "llm_status": result.get("llm_status"),
            },
        }
