from __future__ import annotations

from server.script_adapters import SCRIPTS_DIR

import sys


if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from ability_api_server import validate_capability_evidence  # noqa: E402


def test_capability_evidence_requires_improvement_advice() -> None:
    errors = validate_capability_evidence(
        {
            "evidence": [
                {
                    "source_type": "resume_text",
                    "source_id": "resume_text_01",
                    "capability_evidence": [
                        {
                            "capability_key": "logical_analysis",
                            "score": 82,
                            "confidence": 0.68,
                            "evidence_summary": "Resume shows structured analysis evidence.",
                        }
                    ],
                }
            ]
        }
    )

    assert "Missing improvement_advice for logical_analysis" in errors


def test_capability_evidence_accepts_improvement_advice() -> None:
    errors = validate_capability_evidence(
        {
            "evidence": [
                {
                    "source_type": "resume_text",
                    "source_id": "resume_text_01",
                    "capability_evidence": [
                        {
                            "capability_key": "logical_analysis",
                            "score": 82,
                            "confidence": 0.68,
                            "evidence_summary": "Resume shows structured analysis evidence.",
                            "improvement_advice": "今天画一张问题树，补 3 个影响因素和对应证据。",
                        }
                    ],
                }
            ]
        }
    )

    assert errors == []
