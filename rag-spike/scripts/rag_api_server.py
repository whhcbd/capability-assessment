from __future__ import annotations

import argparse
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import extract_role_profile


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765


def extract_role_profile_for_request(
    *,
    role_id: str,
    role_name: str,
    jd_text: str,
    top_k: int,
    timeout: int,
    retries: int,
) -> dict[str, Any]:
    started_at = time.perf_counter()
    query = jd_text.strip() or role_name
    config = extract_role_profile.get_config(extract_role_profile.ENV_PATH)
    retrieval_query = extract_role_profile.build_bilingual_retrieval_query(
        config=config,
        role_name=role_name,
        jd_text=query,
        timeout=timeout,
    )
    chunks = extract_role_profile.retrieve_chunks(
        query=retrieval_query["query"],
        model_name=extract_role_profile.DEFAULT_MODEL,
        index_dir=extract_role_profile.INDEX_DIR,
        top_k=top_k,
    )
    prompt = extract_role_profile.build_prompt(role_id, role_name, query, chunks)

    last_error: Exception | None = None
    profile: dict[str, Any] | None = None
    for attempt in range(retries + 1):
        try:
            content = extract_role_profile.call_deepseek(config, prompt, timeout)
            profile = extract_role_profile.extract_json_response(content)
            profile = extract_role_profile.normalize_source_refs(profile, chunks)
            validation_errors = extract_role_profile.validate_profile(profile)
            if validation_errors:
                raise RuntimeError("; ".join(validation_errors))
            break
        except Exception as error:  # noqa: BLE001 - spike server returns a structured error
            last_error = error
            if attempt >= retries:
                raise RuntimeError(f"DeepSeek RAG extraction failed: {error}") from error
            time.sleep(1)

    if profile is None:
        raise RuntimeError(f"DeepSeek RAG extraction failed: {last_error}")

    return {
        "profile": profile,
        "retrieved_chunks": chunks,
        "retrieval_query": retrieval_query,
        "deepseek_model": config["model"],
        "validation_errors": extract_role_profile.validate_profile(profile),
        "elapsed_seconds": round(time.perf_counter() - started_at, 3),
    }


class RagApiHandler(BaseHTTPRequestHandler):
    server_version = "CapabilityRagApi/0.1"

    def do_OPTIONS(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler hook
        self.send_json({}, status=204)

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler hook
        if self.path.split("?", 1)[0] != "/health":
            self.send_json({"error": "Not found"}, status=404)
            return
        self.send_json(
            {
                "ok": True,
                "service": "capability-assessment-rag-api",
                "model": extract_role_profile.DEFAULT_MODEL,
                "index_dir": str(extract_role_profile.INDEX_DIR),
            }
        )

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler hook
        if self.path.split("?", 1)[0] != "/role-profile":
            self.send_json({"error": "Not found"}, status=404)
            return

        try:
            payload = self.read_payload()
            role_id = str(payload.get("role_id") or "custom_role").strip()
            role_name = str(payload.get("role_name") or "自定义岗位").strip()
            query = str(payload.get("query") or "").strip()
            jd_text = str(payload.get("jd_text") or query).strip()
            top_k = int(payload.get("top_k") or 5)
            timeout = int(payload.get("timeout") or 90)
            retries = int(payload.get("retries") or 1)

            if not role_id or not role_name:
                raise ValueError("role_id and role_name are required.")
            if not 1 <= top_k <= 10:
                raise ValueError("top_k must be between 1 and 10.")

            result = extract_role_profile_for_request(
                role_id=role_id,
                role_name=role_name,
                jd_text=jd_text,
                top_k=top_k,
                timeout=timeout,
                retries=retries,
            )
            self.send_json(result)
        except Exception as error:  # noqa: BLE001 - return structured local demo errors
            self.send_json({"error": str(error)}, status=500)

    def read_payload(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(content_length).decode("utf-8")
        if not body:
            return {}
        payload = json.loads(body)
        if not isinstance(payload, dict):
            raise ValueError("JSON body must be an object.")
        return payload

    def send_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if status != 204:
            self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[rag-api] {self.address_string()} - {format % args}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run local RAG API server for the static demo.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), RagApiHandler)
    print(f"RAG API server listening on http://{args.host}:{args.port}")
    print("Open /health to verify the server. Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopping RAG API server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
