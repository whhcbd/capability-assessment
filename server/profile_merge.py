from __future__ import annotations

from typing import Any


CAPABILITY_KEYS = [
    "communication_expression",
    "logical_analysis",
    "learning_adaptability",
    "execution_ownership",
    "collaboration_leadership",
    "self_awareness_motivation",
    "data_digital_literacy",
    "business_industry_understanding",
]

SOURCE_WEIGHT = {
    "resume_text": 1.3,
    "self_assessment": 0.72,
    "questionnaire": 0.72,
}


def clamp_score(value: Any) -> int:
    try:
        number = round(float(value))
    except (TypeError, ValueError):
        number = 0
    return max(0, min(100, number))


def clamp_confidence(value: Any) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = 0
    return max(0, min(1, round(number, 2)))


def merge_capability_profile(evidence_groups: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {key: [] for key in CAPABILITY_KEYS}
    for group in evidence_groups:
        source_type = str(group.get("source_type") or "")
        source_id = str(group.get("source_id") or "")
        for item in group.get("capability_evidence") or []:
            key = item.get("capability_key")
            if key in grouped:
                grouped[key].append({**item, "source_type": source_type, "source_id": source_id})

    profile: dict[str, dict[str, Any]] = {}
    for key, items in grouped.items():
        if not items:
            profile[key] = {
                "score": 42,
                "confidence": 0.16,
                "evidence_sources": [],
                "evidence_summary": "Current inputs lack enough behavioral evidence.",
            }
            continue

        total_weight = sum(SOURCE_WEIGHT.get(str(item.get("source_type")), 1) for item in items)
        weighted_score = sum(
            float(item.get("score") or 0) * SOURCE_WEIGHT.get(str(item.get("source_type")), 1)
            for item in items
        ) / max(total_weight, 1)
        average_confidence = sum(float(item.get("confidence") or 0) for item in items) / max(
            len(items), 1
        )
        sources = sorted({str(item.get("source_type")) for item in items if item.get("source_type")})
        source_diversity_bonus = min(0.12, len(sources) * 0.04)
        profile[key] = {
            "score": clamp_score(weighted_score),
            "confidence": clamp_confidence(average_confidence + source_diversity_bonus),
            "evidence_sources": sources,
            "evidence_summary": " ".join(
                str(item.get("evidence_summary") or "").strip()
                for item in items[:3]
                if str(item.get("evidence_summary") or "").strip()
            ),
        }
    return profile
