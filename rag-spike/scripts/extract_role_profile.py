from __future__ import annotations

import argparse
import json
import os
import sys
import textwrap
import time
import urllib.error
import urllib.request
from functools import lru_cache
from pathlib import Path
from typing import Any

os.environ.setdefault("HF_HUB_OFFLINE", "0")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "0")

try:
    import pysqlite3

    sys.modules["sqlite3"] = pysqlite3
except ImportError:
    pass

import chromadb
from sentence_transformers import SentenceTransformer


DEFAULT_MODEL = "BAAI/bge-m3"
ROOT = Path(__file__).resolve().parents[1]
INDEX_DIR = ROOT / "index" / "chroma"
ENV_PATH = ROOT / ".env"
OUTPUT_PATH = ROOT / "outputs" / "role-profile-product-manager.json"
COLLECTION_NAME = "capability_role_knowledge"
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
PROHIBITED_TERMS = ["岗位推荐", "匹配度报告", "训练建议", "课程推荐", "简历生成"]
MAX_RETRIEVAL_QUERY_CHARS = 1200


def build_chunk_ref(chunk: dict[str, Any]) -> str:
    source_file = str(chunk["source_file"])
    if source_file.lower().endswith(".pdf") and chunk.get("page_number"):
        return f"{source_file}#page_{chunk['page_number']}#chunk_{chunk['chunk_index']}"
    return f"{source_file}#{chunk['chunk_index']}"


def normalize_source_refs(profile: dict[str, Any], chunks: list[dict[str, Any]]) -> dict[str, Any]:
    chunk_refs = [build_chunk_ref(chunk) for chunk in chunks]
    valid_refs = set(chunk_refs)
    first_ref_by_source: dict[str, str] = {}
    for chunk in chunks:
        first_ref_by_source.setdefault(str(chunk["source_file"]), build_chunk_ref(chunk))

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


def load_env(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def get_config(env_path: Path) -> dict[str, str]:
    file_env = load_env(env_path)
    api_key = os.environ.get("DEEPSEEK_API_KEY") or file_env.get("DEEPSEEK_API_KEY")
    if not api_key:
        raise RuntimeError("Missing DEEPSEEK_API_KEY. Set it in rag-spike/.env or environment.")
    return {
        "api_key": api_key,
        "model": os.environ.get("DEEPSEEK_MODEL") or file_env.get("DEEPSEEK_MODEL") or "deepseek-chat",
        "base_url": (os.environ.get("DEEPSEEK_BASE_URL") or file_env.get("DEEPSEEK_BASE_URL") or "https://api.deepseek.com").rstrip("/"),
    }


def build_retrieval_query_prompt(role_name: str, jd_text: str) -> str:
    return textwrap.dedent(
        f"""
        You are preparing a retrieval query for an English software engineering knowledge base.
        Convert the Chinese role name and JD into concise English search language for SWEBOK-style content.

        Output JSON only. Do not explain.

        Role name:
        {role_name}

        JD:
        {jd_text or role_name}

        Requirements:
        - Keep the query in English.
        - Focus on software engineering lifecycle, requirements, design, testing, maintenance, quality, project work, product work, data-informed decisions, stakeholder collaboration, risk, and process.
        - Do not translate literally if a better software engineering term exists.
        - Keep it under 160 words.

        JSON shape:
        {{
          "retrieval_query": "product management intern, requirements analysis, software requirements specification, stakeholder communication, validation, testing, release risk, metrics-driven iteration"
        }}
        """
    ).strip()


def normalize_retrieval_query(value: Any) -> str:
    if isinstance(value, list):
        value = ", ".join(str(item).strip() for item in value if str(item).strip())
    if not isinstance(value, str):
        return ""
    return " ".join(value.strip().split())[:MAX_RETRIEVAL_QUERY_CHARS]


def generate_english_retrieval_query(
    *,
    config: dict[str, str],
    role_name: str,
    jd_text: str,
    timeout: int,
) -> str:
    prompt = build_retrieval_query_prompt(role_name, jd_text)
    content = call_deepseek(config, prompt, min(timeout, 30))
    payload = extract_json_response(content)
    query = (
        payload.get("retrieval_query")
        or payload.get("english_query")
        or payload.get("query")
        or payload.get("keywords")
    )
    return normalize_retrieval_query(query)


def build_bilingual_retrieval_query(
    *,
    config: dict[str, str] | None,
    role_name: str,
    jd_text: str,
    timeout: int,
) -> dict[str, Any]:
    original_query = "\n\n".join(value for value in [role_name.strip(), jd_text.strip()] if value).strip()
    if not original_query:
        original_query = role_name.strip()

    english_query = ""
    status = "fallback_original_query"
    error = ""
    if config:
        try:
            english_query = generate_english_retrieval_query(
                config=config,
                role_name=role_name,
                jd_text=jd_text,
                timeout=timeout,
            )
            if english_query:
                status = "bilingual_query_generated"
        except Exception as exc:  # noqa: BLE001 - retrieval query enhancement must not block the main flow
            error = str(exc)

    mixed_query = original_query
    if english_query:
        mixed_query = (
            "Original Chinese role/JD:\n"
            f"{original_query}\n\n"
            "English retrieval query for SWEBOK/software engineering knowledge base:\n"
            f"{english_query}"
        )

    return {
        "query": mixed_query,
        "original_query": original_query,
        "english_query": english_query,
        "status": status,
        "error": error,
    }


@lru_cache(maxsize=2)
def get_embedding_model(model_name: str) -> SentenceTransformer:
    return SentenceTransformer(model_name, local_files_only=True)


def retrieve_chunks(query: str, model_name: str, index_dir: Path, top_k: int) -> list[dict[str, Any]]:
    os.environ["HF_HUB_OFFLINE"] = "1"
    model = get_embedding_model(model_name)
    query_embedding = model.encode([query], normalize_embeddings=True).tolist()[0]

    client = chromadb.PersistentClient(path=str(index_dir))
    collection = client.get_collection(name=COLLECTION_NAME)
    result = collection.query(query_embeddings=[query_embedding], n_results=top_k)

    matches: list[dict[str, Any]] = []
    ids = result.get("ids", [[]])[0]
    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]
    for item_id, document, metadata, distance in zip(ids, documents, metadatas, distances, strict=False):
        matches.append(
            {
                "id": item_id,
                "distance": round(float(distance), 6),
                "source_file": metadata.get("source_file"),
                "source_type": metadata.get("source_type"),
                "page_number": metadata.get("page_number"),
                "chunk_index": metadata.get("chunk_index"),
                "text": document,
            }
        )
    return matches


def build_prompt(role_id: str, role_name: str, query: str, chunks: list[dict[str, Any]]) -> str:
    context = "\n\n".join(
        f"[source: {chunk['source_file']}#{chunk['chunk_index']} distance={chunk['distance']}]\n{chunk['text']}"
        for chunk in chunks
    )
    keys = "\n".join(f"- {key}" for key in CAPABILITY_KEYS)
    available_refs = "\n".join(f"- {build_chunk_ref(chunk)}" for chunk in chunks)
    return textwrap.dedent(
        f"""
        你是职业能力模型抽取器。请根据岗位输入和检索资料，生成岗位能力需求图。

        只允许输出 JSON，不要输出 Markdown，不要解释。
        JSON 必须是一个对象，字段必须兼容 role_capability_profile。

        岗位信息：
        role_id: {role_id}
        role_name: {role_name}
        query_or_jd: {query}

        只能使用以下 capability keys：
        {keys}

        输出要求：
        - source_type 必须是 "rag_generated_role_profile"
        - rag_status 必须是 "generated"
        - profile_version 必须是 "v1"
        - requirements 的 key 必须来自上述 capability keys
        - required_level 范围 0-100
        - weight 范围 0.00-1.00，所有 requirements 的 weight 总和尽量接近 1.00
        - requirement_summary 必须说明岗位为什么需要该能力，并依据岗位输入或检索资料
        - source_refs 必须引用使用到的检索 chunk；Markdown 格式是 "source-file.md#chunk_index"，PDF 格式是 "source-file.pdf#page_页码#chunk_序号"
        - source_refs 只能从下方可用 source_refs 中选择
        - 不允许输出岗位推荐、匹配度报告、训练建议、课程推荐、简历生成内容

        可用 source_refs：
        {available_refs}

        目标 JSON 形状：
        {{
          "role_id": "{role_id}",
          "role_name": "{role_name}",
          "profile_version": "v1",
          "source_type": "rag_generated_role_profile",
          "rag_status": "generated",
          "source_refs": ["source-file.md#1"],
          "requirements": {{
            "logical_analysis": {{
              "required_level": 80,
              "weight": 0.25,
              "requirement_summary": "需要拆解业务问题、用户路径和产品指标。"
            }}
          }}
        }}

        检索资料：
        {context}
        """
    ).strip()


def call_deepseek(config: dict[str, str], prompt: str, timeout: int) -> str:
    url = f"{config['base_url']}/chat/completions"
    payload = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": "你只输出合法 JSON。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config['api_key']}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"DeepSeek HTTP {error.code}: {detail}") from error
    return body["choices"][0]["message"]["content"]


def validate_profile(profile: dict[str, Any]) -> list[str]:
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

    source_refs = profile.get("source_refs")
    if not isinstance(source_refs, list) or not source_refs:
        errors.append("source_refs must be a non-empty array")
    else:
        for source_ref in source_refs:
            if not isinstance(source_ref, str) or not source_ref.strip():
                errors.append("source_refs must only contain non-empty strings")
                continue
            parts = source_ref.split("#")
            if len(parts) not in {2, 3}:
                errors.append(f"source_ref must use supported file#chunk format: {source_ref}")
                continue
            if len(parts) == 2 and parts[0].endswith(".md") and parts[1].isdigit():
                continue
            if len(parts) == 3 and parts[0].endswith(".pdf"):
                page = parts[1].removeprefix("page_")
                chunk = parts[2].removeprefix("chunk_")
                if parts[1].startswith("page_") and parts[2].startswith("chunk_") and page.isdigit() and chunk.isdigit():
                    continue
            errors.append(f"Invalid source_ref format: {source_ref}")

    requirements = profile.get("requirements", {})
    if not isinstance(requirements, dict) or not requirements:
        errors.append("requirements must be a non-empty object")
        return errors

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
        if not isinstance(summary, str) or not summary.strip():
            errors.append(f"Missing requirement_summary for {key}")
        elif any(term in summary for term in PROHIBITED_TERMS):
            errors.append(f"Out-of-scope term in summary for {key}")

    serialized = json.dumps(profile, ensure_ascii=False)
    for term in PROHIBITED_TERMS:
        if term in serialized:
            errors.append(f"Out-of-scope term found: {term}")
    return errors


def extract_json_response(content: str) -> dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start >= 0 and end > start:
            return json.loads(content[start : end + 1])
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract role capability profile with DeepSeek.")
    parser.add_argument(
        "--query",
        default="互联网产品经理实习生 需要用户调研 数据指标 产品原型 协作",
        help="Role name or JD text.",
    )
    parser.add_argument("--role-id", default="internet_product_intern")
    parser.add_argument("--role-name", default="互联网产品经理实习生")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Local embedding model.")
    parser.add_argument("--index-dir", type=Path, default=INDEX_DIR)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--env", type=Path, default=ENV_PATH)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--timeout", type=int, default=90)
    parser.add_argument("--retries", type=int, default=1)
    args = parser.parse_args()

    started_at = time.perf_counter()
    config = get_config(args.env)
    retrieval_query = build_bilingual_retrieval_query(
        config=config,
        role_name=args.role_name,
        jd_text=args.query,
        timeout=args.timeout,
    )
    chunks = retrieve_chunks(retrieval_query["query"], args.model, args.index_dir, args.top_k)
    prompt = build_prompt(args.role_id, args.role_name, args.query, chunks)

    last_error: Exception | None = None
    profile: dict[str, Any] | None = None
    raw_content = ""
    for attempt in range(args.retries + 1):
        try:
            raw_content = call_deepseek(config, prompt, args.timeout)
            profile = extract_json_response(raw_content)
            profile = normalize_source_refs(profile, chunks)
            validation_errors = validate_profile(profile)
            if validation_errors:
                raise RuntimeError("; ".join(validation_errors))
            break
        except Exception as error:  # noqa: BLE001 - retry wrapper for spike script
            last_error = error
            if attempt >= args.retries:
                raise
            time.sleep(1)

    if profile is None:
        raise RuntimeError(f"DeepSeek extraction failed: {last_error}")

    output = {
        "profile": profile,
        "retrieved_chunks": chunks,
        "retrieval_query": retrieval_query,
        "deepseek_model": config["model"],
        "validation_errors": validate_profile(profile),
        "elapsed_seconds": round(time.perf_counter() - started_at, 3),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
