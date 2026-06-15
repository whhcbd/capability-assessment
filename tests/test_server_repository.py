from __future__ import annotations

from pathlib import Path

from server.profile_merge import merge_capability_profile
from server.repository import AssessmentRepository


def test_repository_persists_student_assessment(tmp_path: Path) -> None:
    repository = AssessmentRepository(tmp_path / "assessment.sqlite3")
    session = repository.create_role_session(
        student_id="student_001",
        resume_text="resume text",
        target_role="Product Manager Intern",
        target_jd="JD text",
        role_profile={"role_id": "pm", "requirements": {}},
        role_api_meta={"deepseek_model": "deepseek-chat"},
    )

    completed = repository.complete_assessment(
        assessment_id=session["id"],
        student_id="student_001",
        evidence=[
            {
                "source_type": "resume_text",
                "source_id": "resume_text_01",
                "capability_evidence": [
                    {
                        "capability_key": "logical_analysis",
                        "score": 70,
                        "confidence": 0.6,
                        "evidence_summary": "Structured analysis evidence.",
                    }
                ],
            }
        ],
        capability_profile={"logical_analysis": {"score": 70}},
        ability_api_meta={"llm_status": "llm_generated_capability_evidence"},
        questionnaire_answers=[{"id": "q1", "score": 4}],
    )

    latest = repository.get_latest_for_student("student_001")
    assert completed["status"] == "completed"
    assert latest is not None
    assert latest["id"] == session["id"]
    assert latest["role_profile"]["role_id"] == "pm"
    assert latest["questionnaire_answers"][0]["id"] == "q1"


def test_merge_capability_profile_keeps_all_capability_keys() -> None:
    profile = merge_capability_profile(
        [
            {
                "source_type": "resume_text",
                "source_id": "resume_text_01",
                "capability_evidence": [
                    {
                        "capability_key": "logical_analysis",
                        "score": 88,
                        "confidence": 0.7,
                        "evidence_summary": "Resume shows analytical work.",
                        "improvement_advice": "Draft an analysis case with metrics today.",
                    }
                ],
            },
            {
                "source_type": "self_assessment",
                "source_id": "questionnaire_48",
                "capability_evidence": [
                    {
                        "capability_key": "logical_analysis",
                        "score": 80,
                        "confidence": 0.4,
                        "evidence_summary": "Self assessment is consistent.",
                        "improvement_advice": "Add one questionnaire-backed example this week.",
                    }
                ],
            },
        ]
    )

    assert len(profile) == 8
    assert profile["logical_analysis"]["score"] > 80
    assert "resume_text" in profile["logical_analysis"]["evidence_sources"]
    assert "Draft an analysis case" in profile["logical_analysis"]["improvement_advice"]
    assert profile["communication_expression"]["confidence"] == 0.16
    assert profile["communication_expression"]["improvement_advice"]
