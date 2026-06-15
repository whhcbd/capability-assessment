from __future__ import annotations

import json
import textwrap
import time
from pathlib import Path
from typing import Any

import extract_role_profile


DEFAULT_QUESTION_COUNT = 15
MAX_QUESTION_COUNT = 20
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "outputs" / "role-generated-questionnaire.json"
CAPABILITY_KEYS = extract_role_profile.CAPABILITY_KEYS


def build_questionnaire_prompt(
    *,
    role_name: str,
    jd_text: str,
    chunks: list[dict[str, Any]],
    question_count: int,
) -> str:
    context = "\n\n".join(
        f"[source: {extract_role_profile.build_chunk_ref(chunk)} distance={chunk['distance']}]\n{chunk['text']}"
        for chunk in chunks
    )
    keys = "\n".join(f"- {key}" for key in CAPABILITY_KEYS)
    return textwrap.dedent(
        f"""
        你是职业能力行为锚定问卷设计器。请根据目标岗位 JD 和检索到的软件工程知识库内容，
        生成更贴合该岗位的 1-5 分 Likert 自评问卷。

        只允许输出 JSON，不要输出 Markdown，不要解释。
        不要生成开放题、选择题、判断题、知识考试题、岗位推荐或录用判断。

        目标岗位：
        {role_name}

        JD：
        {jd_text or role_name}

        只能使用以下 capability_key：
        {keys}

        输出要求：
        - 顶层必须包含 questionnaire_items 数组。
        - questionnaire_items 必须正好 {question_count} 题。
        - 每题必须包含 capability_key、indicator、evidence_type、text、reverse。
        - capability_key 必须来自上方列表。
        - text 必须是中文第一人称自评陈述句，适合用“很少出现”到“稳定做到并能举出结果”五档回答。
        - text 必须贴合软件工程/互联网岗位真实工作场景，例如需求澄清、范围取舍、研发协作、测试验证、上线风险、数据判断、维护迭代。
        - text 不要问“是否知道某概念”，要问用户是否做过可观察行为。
        - reverse 为布尔值；反向题最多 3 题。
        - 15 题应覆盖至少 6 个不同 capability_key。
        - 顶层可包含 source_refs，引用使用过的检索来源。

        目标 JSON 形状：
        {{
          "source_refs": ["swebok-v4.pdf#page_10#chunk_1"],
          "questionnaire_items": [
            {{
              "capability_key": "logical_analysis",
              "indicator": "需求拆解",
              "evidence_type": "岗位化自评",
              "text": "面对一个模糊功能需求时，我能先澄清用户、目标、约束和验收标准，再讨论方案。",
              "reverse": false
            }}
          ]
        }}

        检索资料：
        {context}
        """
    ).strip()


def normalize_source_refs(payload: dict[str, Any], chunks: list[dict[str, Any]]) -> dict[str, Any]:
    valid_refs = [extract_role_profile.build_chunk_ref(chunk) for chunk in chunks]
    valid_ref_set = set(valid_refs)
    raw_refs = payload.get("source_refs")
    if not isinstance(raw_refs, list):
        raw_refs = []

    normalized: list[str] = []
    for raw_ref in raw_refs:
        if not isinstance(raw_ref, str):
            continue
        ref = raw_ref.strip()
        if ref in valid_ref_set and ref not in normalized:
            normalized.append(ref)

    if not normalized:
        normalized = valid_refs[: min(3, len(valid_refs))]
    payload["source_refs"] = normalized
    return payload


def validate_questionnaire_payload(payload: dict[str, Any], question_count: int) -> list[str]:
    errors: list[str] = []
    items = payload.get("questionnaire_items")
    if not isinstance(items, list):
        return ["questionnaire_items must be an array"]
    if len(items) != question_count:
        errors.append(f"questionnaire_items must contain exactly {question_count} items")

    reverse_count = 0
    capability_keys: set[str] = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append(f"questionnaire_items[{index}] must be an object")
            continue
        key = item.get("capability_key")
        indicator = item.get("indicator")
        evidence_type = item.get("evidence_type")
        text = item.get("text")
        reverse = item.get("reverse")
        if key not in CAPABILITY_KEYS:
            errors.append(f"Unknown capability_key at item {index + 1}: {key}")
        else:
            capability_keys.add(str(key))
        if not isinstance(indicator, str) or not indicator.strip():
            errors.append(f"Missing indicator at item {index + 1}")
        if not isinstance(evidence_type, str) or not evidence_type.strip():
            errors.append(f"Missing evidence_type at item {index + 1}")
        if not isinstance(text, str) or len(text.strip()) < 12:
            errors.append(f"Question text is too short at item {index + 1}")
        if not isinstance(reverse, bool):
            errors.append(f"reverse must be boolean at item {index + 1}")
        elif reverse:
            reverse_count += 1

    if reverse_count > 3:
        errors.append("reverse questions must be at most 3")
    if len(capability_keys) < 6:
        errors.append("questionnaire must cover at least 6 capability_key values")
    return errors


def normalized_questionnaire_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    for index, item in enumerate(payload.get("questionnaire_items") or [], start=1):
        output.append(
            {
                "id": f"ai_{index:02d}",
                "capability_key": item["capability_key"],
                "indicator": item["indicator"].strip(),
                "evidence_type": item["evidence_type"].strip(),
                "text": item["text"].strip(),
                "reverse": bool(item.get("reverse", False)),
            }
        )
    return output


def generate_role_questionnaire_for_request(
    *,
    role_name: str,
    jd_text: str,
    question_count: int = DEFAULT_QUESTION_COUNT,
    top_k: int = 6,
    timeout: int = 120,
    retries: int = 1,
) -> dict[str, Any]:
    if not 1 <= question_count <= MAX_QUESTION_COUNT:
        raise ValueError(f"question_count must be between 1 and {MAX_QUESTION_COUNT}.")

    started_at = time.perf_counter()
    query = "\n\n".join(value for value in [role_name.strip(), jd_text.strip()] if value)
    config = extract_role_profile.get_config(extract_role_profile.ENV_PATH)
    chunks = extract_role_profile.retrieve_chunks(
        query=query or role_name,
        model_name=extract_role_profile.DEFAULT_MODEL,
        index_dir=extract_role_profile.INDEX_DIR,
        top_k=top_k,
    )
    if not chunks:
        raise RuntimeError("No knowledge chunks retrieved for role questionnaire generation.")

    prompt = build_questionnaire_prompt(
        role_name=role_name,
        jd_text=jd_text,
        chunks=chunks,
        question_count=question_count,
    )

    last_error: Exception | None = None
    payload: dict[str, Any] | None = None
    for attempt in range(retries + 1):
        try:
            content = extract_role_profile.call_deepseek(config, prompt, timeout)
            payload = extract_role_profile.extract_json_response(content)
            payload = normalize_source_refs(payload, chunks)
            validation_errors = validate_questionnaire_payload(payload, question_count)
            if validation_errors:
                raise RuntimeError("; ".join(validation_errors))
            break
        except Exception as error:  # noqa: BLE001 - retry wrapper for LLM output
            last_error = error
            if attempt >= retries:
                raise RuntimeError(f"DeepSeek questionnaire generation failed: {error}") from error
            time.sleep(1)

    if payload is None:
        raise RuntimeError(f"DeepSeek questionnaire generation failed: {last_error}")

    return {
        "questionnaire_items": normalized_questionnaire_items(payload),
        "source_refs": payload.get("source_refs") or [],
        "retrieved_chunks": chunks,
        "deepseek_model": config["model"],
        "validation_errors": validate_questionnaire_payload(payload, question_count),
        "elapsed_seconds": round(time.perf_counter() - started_at, 3),
        "llm_status": "llm_generated_role_questionnaire",
    }


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Generate role-specific questionnaire with DeepSeek.")
    parser.add_argument("--role-name", default="互联网产品经理实习生")
    parser.add_argument("--jd-text", default="")
    parser.add_argument("--question-count", type=int, default=DEFAULT_QUESTION_COUNT)
    parser.add_argument("--top-k", type=int, default=6)
    parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--retries", type=int, default=1)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    result = generate_role_questionnaire_for_request(
        role_name=args.role_name,
        jd_text=args.jd_text,
        question_count=args.question_count,
        top_k=args.top_k,
        timeout=args.timeout,
        retries=args.retries,
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
