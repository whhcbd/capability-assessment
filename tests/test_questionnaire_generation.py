from __future__ import annotations

import sys

from server.script_adapters import SCRIPTS_DIR


if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from generate_questionnaire import validate_questionnaire_payload  # noqa: E402


def generated_items(count: int = 15) -> list[dict]:
    keys = [
        "communication_expression",
        "logical_analysis",
        "learning_adaptability",
        "execution_ownership",
        "collaboration_leadership",
        "self_awareness_motivation",
        "data_digital_literacy",
        "business_industry_understanding",
    ]
    return [
        {
            "capability_key": keys[index % len(keys)],
            "indicator": "岗位化行为",
            "evidence_type": "AI 岗位问卷",
            "text": f"面对软件工程岗位场景 {index + 1} 时，我能说明目标、约束、行动和结果。",
            "reverse": False,
        }
        for index in range(count)
    ]


def test_generated_questionnaire_validation_accepts_15_items() -> None:
    errors = validate_questionnaire_payload({"questionnaire_items": generated_items()}, 15)

    assert errors == []


def test_generated_questionnaire_validation_rejects_wrong_count() -> None:
    errors = validate_questionnaire_payload({"questionnaire_items": generated_items(14)}, 15)

    assert "questionnaire_items must contain exactly 15 items" in errors


def test_generated_questionnaire_validation_rejects_unknown_capability_key() -> None:
    items = generated_items()
    items[0]["capability_key"] = "unknown_key"

    errors = validate_questionnaire_payload({"questionnaire_items": items}, 15)

    assert "Unknown capability_key at item 1: unknown_key" in errors
