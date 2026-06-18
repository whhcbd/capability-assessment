from __future__ import annotations

import sys

from server.script_adapters import SCRIPTS_DIR


if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import extract_role_profile  # noqa: E402
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


def role_dimensions() -> list[dict]:
    keys = [
        "communication_expression",
        "logical_analysis",
        "learning_adaptability",
        "execution_ownership",
        "collaboration_leadership",
        "business_industry_understanding",
    ]
    return [
        {
            "dimension_id": f"role_dim_{index + 1:02d}",
            "label": f"岗位维度 {index + 1}",
            "required_level": 75,
            "weight": round(1 / 6, 3),
            "mapped_capability_keys": [key],
        }
        for index, key in enumerate(keys)
    ]


def generated_role_dimension_items(count: int = 15) -> list[dict]:
    dimensions = role_dimensions()
    items = generated_items(count)
    for index, item in enumerate(items):
        item["role_dimension_id"] = dimensions[index % len(dimensions)]["dimension_id"]
    return items
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


def test_generated_questionnaire_validation_accepts_role_dimension_ids() -> None:
    errors = validate_questionnaire_payload(
        {"questionnaire_items": generated_role_dimension_items()},
        15,
        role_dimensions(),
    )

    assert errors == []


def test_generated_questionnaire_validation_rejects_unknown_role_dimension_id() -> None:
    items = generated_role_dimension_items()
    items[0]["role_dimension_id"] = "unknown_dimension"

    errors = validate_questionnaire_payload({"questionnaire_items": items}, 15, role_dimensions())

    assert "Unknown role_dimension_id at item 1: unknown_dimension" in errors


def test_role_profile_v2_validation_accepts_six_role_dimensions() -> None:
    profile = {
        "role_id": "pm",
        "role_name": "产品经理实习生",
        "profile_version": "v2",
        "source_type": "rag_generated_role_profile",
        "rag_status": "generated",
        "source_refs": ["role-capability-v2-guide.md#1"],
        "role_dimensions": [
            {
                **dimension,
                "description": "岗位维度说明",
                "evaluation_method": "结合简历证据、问卷自评和模型判断。",
                "questionnaire_focus": "考察真实行为证据。",
                "knowledge_basis": "依据 JD 和岗位指南。",
                "improvement_direction": "补充一个真实案例。",
            }
            for dimension in role_dimensions()
        ],
    }
    normalized = extract_role_profile.normalize_role_dimensions(profile)

    errors = extract_role_profile.validate_profile(normalized)

    assert errors == []
    assert len(normalized["role_dimensions"]) == 6
    assert normalized["requirements"]


def test_bilingual_retrieval_query_combines_chinese_and_english(monkeypatch) -> None:
    def fake_call_deepseek(config, prompt, timeout):  # noqa: ANN001
        return '{"retrieval_query": "requirements analysis, product specification, stakeholder collaboration"}'

    monkeypatch.setattr(extract_role_profile, "call_deepseek", fake_call_deepseek)

    result = extract_role_profile.build_bilingual_retrieval_query(
        config={"api_key": "test", "model": "deepseek-chat", "base_url": "https://example.test"},
        role_name="互联网产品经理实习生",
        jd_text="负责需求分析、PRD、跨团队沟通和数据复盘。",
        timeout=120,
    )

    assert result["status"] == "bilingual_query_generated"
    assert "互联网产品经理实习生" in result["query"]
    assert "requirements analysis" in result["query"]
    assert result["english_query"].startswith("requirements analysis")


def test_bilingual_retrieval_query_falls_back_to_original(monkeypatch) -> None:
    def fake_call_deepseek(config, prompt, timeout):  # noqa: ANN001
        raise RuntimeError("translation failed")

    monkeypatch.setattr(extract_role_profile, "call_deepseek", fake_call_deepseek)

    result = extract_role_profile.build_bilingual_retrieval_query(
        config={"api_key": "test", "model": "deepseek-chat", "base_url": "https://example.test"},
        role_name="互联网产品经理实习生",
        jd_text="负责需求分析、PRD、跨团队沟通和数据复盘。",
        timeout=120,
    )

    assert result["status"] == "fallback_original_query"
    assert result["english_query"] == ""
    assert "互联网产品经理实习生" in result["query"]
    assert "translation failed" in result["error"]
