from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient


TEST_DB_PATH = Path(__file__).resolve().parent / ".test-api.sqlite3"
os.environ.setdefault("CAPABILITY_ASSESSMENT_DB", str(TEST_DB_PATH))

from server import main  # noqa: E402


def fake_session(**overrides: Any) -> dict[str, Any]:
    session = {
        "id": "assessment_001",
        "student_id": "student_001",
        "status": "questionnaire_pending",
        "target_role": "Product Manager Intern",
        "target_jd": "JD text",
        "role_profile": {"role_id": "pm", "requirements": {}},
        "role_api_meta": {"deepseek_model": "deepseek-chat"},
        "evidence": None,
        "capability_profile": None,
        "ability_api_meta": None,
        "questionnaire_answers": None,
        "created_at": "2026-06-10T00:00:00+00:00",
        "updated_at": "2026-06-10T00:00:00+00:00",
        "completed_at": None,
    }
    session.update(overrides)
    return session


def teardown_module() -> None:
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


def test_role_profile_uses_student_header(monkeypatch) -> None:
    captured: dict[str, Any] = {}

    def create_role_profile(*, student_id: str, request: Any) -> dict[str, Any]:
        captured["student_id"] = student_id
        captured["target_role"] = request.target_role
        return fake_session(student_id=student_id, target_role=request.target_role)

    monkeypatch.setattr(main.service, "create_role_profile", create_role_profile)
    client = TestClient(main.app)

    response = client.post(
        "/assessments/role-profile",
        headers={"X-Student-Id": "student_abc"},
        json={
            "resume_text": "resume text",
            "target_role": "Data Analyst Intern",
            "target_jd": "JD text",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["assessment_id"] == "assessment_001"
    assert payload["student_id"] == "student_abc"
    assert captured == {
        "student_id": "student_abc",
        "target_role": "Data Analyst Intern",
    }


def test_capability_evidence_returns_404_for_wrong_student(monkeypatch) -> None:
    def complete_questionnaire(*, student_id: str, request: Any) -> dict[str, Any]:
        raise ValueError("Assessment session not found for this student.")

    monkeypatch.setattr(main.service, "complete_questionnaire", complete_questionnaire)
    client = TestClient(main.app)

    response = client.post(
        "/assessments/capability-evidence",
        headers={"X-Student-Id": "student_abc"},
        json={
            "assessment_id": "missing",
            "questionnaire_answers": [
                {
                    "id": "q1",
                    "capability_key": "logical_analysis",
                    "score": 4,
                }
            ],
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"]["error"] == "Assessment session not found for this student."
