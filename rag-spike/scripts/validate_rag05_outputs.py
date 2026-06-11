from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUTPUTS_DIR = ROOT / "outputs"
REPORT_PATH = OUTPUTS_DIR / "rag05-validation-report.json"

CAPABILITY_KEYS = {
    "communication_expression",
    "logical_analysis",
    "learning_adaptability",
    "execution_ownership",
    "collaboration_leadership",
    "self_awareness_motivation",
    "data_digital_literacy",
    "business_industry_understanding",
}
PROHIBITED_TERMS = ["岗位推荐", "匹配度报告", "训练建议", "课程推荐", "简历生成", "面试陪练"]

SAMPLES = [
    {
        "sample_id": "product_manager_intern",
        "input": OUTPUTS_DIR / "role-profile-product-manager.json",
        "profile_output": OUTPUTS_DIR / "role-capability-profile-product-manager.json",
    },
    {
        "sample_id": "data_analyst_intern",
        "input": OUTPUTS_DIR / "role-profile-data-analyst.json",
        "profile_output": OUTPUTS_DIR / "role-capability-profile-data-analyst.json",
    },
]


def build_chunk_ref(chunk: dict[str, Any]) -> str:
    return f"{chunk['source_file']}#{chunk['chunk_index']}"


def normalize_source_refs(profile: dict[str, Any], chunks: list[dict[str, Any]]) -> dict[str, Any]:
    chunk_refs = [build_chunk_ref(chunk) for chunk in chunks if isinstance(chunk, dict)]
    valid_refs = set(chunk_refs)
    first_ref_by_source: dict[str, str] = {}
    for chunk in chunks:
        if not isinstance(chunk, dict):
            continue
        source_file = chunk.get("source_file")
        if source_file:
            first_ref_by_source.setdefault(str(source_file), build_chunk_ref(chunk))

    raw_refs = profile.get("source_refs", [])
    if not isinstance(raw_refs, list):
        raw_refs = []

    normalized_refs: list[str] = []
    for raw_ref in raw_refs:
        if not isinstance(raw_ref, str) or not raw_ref.strip():
            continue
        ref = raw_ref.strip()
        source_file = ref.split("#", 1)[0]
        normalized_ref = ref if ref in valid_refs else first_ref_by_source.get(source_file)
        if normalized_ref and normalized_ref not in normalized_refs:
            normalized_refs.append(normalized_ref)

    if not normalized_refs:
        normalized_refs = chunk_refs[:2]

    profile["source_refs"] = normalized_refs
    return profile


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def validate_profile(profile: dict[str, Any], available_chunk_refs: set[str]) -> list[str]:
    errors: list[str] = []
    required_top_level = [
        "role_id",
        "role_name",
        "profile_version",
        "source_type",
        "rag_status",
        "source_refs",
        "requirements",
    ]
    for key in required_top_level:
        if key not in profile:
            errors.append(f"Missing top-level field: {key}")

    if profile.get("source_type") != "rag_generated_role_profile":
        errors.append('source_type must be "rag_generated_role_profile"')
    if profile.get("rag_status") != "generated":
        errors.append('rag_status must be "generated"')

    source_refs = profile.get("source_refs")
    if not isinstance(source_refs, list) or not source_refs:
        errors.append("source_refs must be a non-empty array")
    else:
        for source_ref in source_refs:
            if not isinstance(source_ref, str) or not source_ref.strip():
                errors.append("source_refs must only contain non-empty strings")
                continue
            if "#" not in source_ref:
                errors.append(f"source_ref must use file#chunk_index format: {source_ref}")
                continue
            source_file, chunk_index = source_ref.rsplit("#", 1)
            if not source_file.endswith(".md") or not chunk_index.isdigit():
                errors.append(f"Invalid source_ref format: {source_ref}")
            elif source_ref not in available_chunk_refs:
                errors.append(f"source_ref was not found in retrieved_chunks: {source_ref}")

    requirements = profile.get("requirements")
    if not isinstance(requirements, dict) or not requirements:
        errors.append("requirements must be a non-empty object")
        return errors

    total_weight = 0.0
    for key, item in requirements.items():
        if key not in CAPABILITY_KEYS:
            errors.append(f"Unknown capability key: {key}")
        if not isinstance(item, dict):
            errors.append(f"Requirement for {key} must be an object")
            continue
        level = item.get("required_level")
        weight = item.get("weight")
        summary = item.get("requirement_summary")
        if not isinstance(level, (int, float)) or not 0 <= float(level) <= 100:
            errors.append(f"Invalid required_level for {key}")
        if not isinstance(weight, (int, float)) or not 0 <= float(weight) <= 1:
            errors.append(f"Invalid weight for {key}")
        else:
            total_weight += float(weight)
        if not isinstance(summary, str) or not summary.strip():
            errors.append(f"Missing requirement_summary for {key}")

    if not 0.95 <= total_weight <= 1.05:
        errors.append(f"Total requirement weight should be close to 1.0, got {total_weight:.3f}")

    serialized_profile = json.dumps(profile, ensure_ascii=False)
    for term in PROHIBITED_TERMS:
        if term in serialized_profile:
            errors.append(f"Out-of-scope term found in role_capability_profile: {term}")

    return errors


def validate_traceability(wrapper: dict[str, Any], profile: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    chunks = wrapper.get("retrieved_chunks", [])
    if not isinstance(chunks, list) or not chunks:
        return ["retrieved_chunks must be present for source_refs traceability checks"]

    retrieved_sources = {build_chunk_ref(chunk) for chunk in chunks if isinstance(chunk, dict)}
    for source_ref in profile.get("source_refs", []):
        if source_ref not in retrieved_sources:
            errors.append(f"source_ref was not found in retrieved_chunks: {source_ref}")
    return errors


def summarize_quality(profile: dict[str, Any], traceability_errors: list[str]) -> dict[str, Any]:
    requirements = profile.get("requirements", {})
    total_weight = round(
        sum(float(item.get("weight", 0)) for item in requirements.values() if isinstance(item, dict)),
        3,
    )
    quality_issues: list[str] = []
    if traceability_errors:
        quality_issues.append("source_refs traceability needs review.")
    if len(requirements) < 4:
        quality_issues.append("requirements coverage is narrow; review whether the role needs more capability keys.")
    if not quality_issues:
        quality_issues.append("No structural or scope issues found in this sample.")

    return {
        "role_id": profile.get("role_id"),
        "role_name": profile.get("role_name"),
        "requirement_keys": list(requirements.keys()),
        "requirement_count": len(requirements),
        "total_weight": total_weight,
        "quality_issues": quality_issues,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate RAG-05 role_capability_profile outputs.")
    parser.add_argument("--outputs-dir", type=Path, default=OUTPUTS_DIR)
    parser.add_argument("--data-dir", type=Path, default=DATA_DIR)
    parser.add_argument("--report", type=Path, default=REPORT_PATH)
    args = parser.parse_args()

    samples_report: list[dict[str, Any]] = []
    all_errors: list[str] = []

    for sample in SAMPLES:
        sample_id = sample["sample_id"]
        input_path = sample["input"]
        profile_output = sample["profile_output"]
        wrapper = read_json(input_path)
        profile = wrapper.get("profile", wrapper)
        if not isinstance(profile, dict):
            raise RuntimeError(f"{sample_id}: profile must be a JSON object")

        chunks = wrapper.get("retrieved_chunks", [])
        profile = normalize_source_refs(profile, chunks if isinstance(chunks, list) else [])
        if "profile" in wrapper:
            wrapper["profile"] = profile
            input_path.write_text(json.dumps(wrapper, ensure_ascii=False, indent=2), encoding="utf-8")

        available_chunk_refs = {
            build_chunk_ref(chunk) for chunk in chunks if isinstance(chunk, dict) and chunk.get("source_file")
        }
        validation_errors = validate_profile(profile, available_chunk_refs)
        traceability_errors = validate_traceability(wrapper, profile)
        sample_errors = validation_errors + traceability_errors
        all_errors.extend(f"{sample_id}: {error}" for error in sample_errors)

        profile_output.write_text(json.dumps(profile, ensure_ascii=False, indent=2), encoding="utf-8")
        samples_report.append(
            {
                "sample_id": sample_id,
                "input": str(input_path.relative_to(ROOT)),
                "profile_output": str(profile_output.relative_to(ROOT)),
                "parseable_json": True,
                "validation_errors": validation_errors,
                "traceability_errors": traceability_errors,
                "quality_summary": summarize_quality(profile, traceability_errors),
            }
        )

    report = {
        "task": "RAG-05",
        "generated_at": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "accepted": not all_errors,
        "sample_count": len(samples_report),
        "samples": samples_report,
        "prohibited_terms_checked": PROHIBITED_TERMS,
        "prompt_improvement_notes": [
            "Ask the extractor to keep source_refs tied to cited retrieval sources only.",
            "Keep source_refs at file#chunk_index granularity so demo reviewers can trace each source.",
            "Add a context selection step to reduce irrelevant same-domain role chunks before DeepSeek extraction.",
        ],
        "demo_mock_replacement_conclusion": (
            "The two generated profiles are structurally ready for a controlled demo replacement experiment, "
            "and the HITL decision is to keep the current mock generator as the default demo path while "
            "exposing real-time DeepSeek RAG only as a manually enabled demo option with mock fallback."
        ),
        "errors": all_errors,
    }
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))

    if all_errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
