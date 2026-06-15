from __future__ import annotations

import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = ROOT / "rag-spike" / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from ability_api_server import extract_resume_text, score_capability_for_request  # noqa: E402
from generate_questionnaire import generate_role_questionnaire_for_request  # noqa: E402
from rag_api_server import extract_role_profile_for_request  # noqa: E402


def build_role_profile(
    *,
    role_id: str,
    role_name: str,
    jd_text: str,
    top_k: int,
    timeout: int,
    retries: int,
) -> dict[str, Any]:
    return extract_role_profile_for_request(
        role_id=role_id,
        role_name=role_name,
        jd_text=jd_text,
        top_k=top_k,
        timeout=timeout,
        retries=retries,
    )


def build_capability_evidence(
    *,
    user_id: str,
    resume_text: str,
    target_role: str,
    questionnaire_answers: list[dict[str, Any]],
    timeout: int,
    retries: int,
    role_requirements: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return score_capability_for_request(
        user_id=user_id,
        resume_text=resume_text,
        target_role=target_role,
        questionnaire_answers=questionnaire_answers,
        timeout=timeout,
        retries=retries,
        role_requirements=role_requirements,
    )


def build_role_questionnaire(
    *,
    role_name: str,
    jd_text: str,
    question_count: int,
    top_k: int,
    timeout: int,
    retries: int,
) -> dict[str, Any]:
    return generate_role_questionnaire_for_request(
        role_name=role_name,
        jd_text=jd_text,
        question_count=question_count,
        top_k=top_k,
        timeout=timeout,
        retries=retries,
    )
