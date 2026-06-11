from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path

from sentence_transformers import SentenceTransformer


DEFAULT_MODEL = "BAAI/bge-m3"
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "product-manager-intern-jd.md"
DEFAULT_OUTPUT = ROOT / "outputs" / "embedding-check.json"


def read_markdown(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify local embedding model for RAG spike.")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="SentenceTransformers model name.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Markdown file to encode.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="JSON report output path.")
    parser.add_argument("--preview-chars", type=int, default=900, help="Input preview length.")
    parser.add_argument(
        "--allow-download",
        action="store_true",
        help="Allow downloading model files if they are not already cached locally.",
    )
    args = parser.parse_args()

    if not args.allow_download:
        os.environ["HF_HUB_OFFLINE"] = "1"

    input_path = args.input.resolve()
    output_path = args.output.resolve()
    text = read_markdown(input_path)
    sample = text[: args.preview_chars]

    started_at = time.perf_counter()
    model = SentenceTransformer(args.model, local_files_only=not args.allow_download)
    load_seconds = time.perf_counter() - started_at

    encode_started_at = time.perf_counter()
    embedding = model.encode([sample], normalize_embeddings=True)[0]
    encode_seconds = time.perf_counter() - encode_started_at

    output_path.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "model": args.model,
        "input_file": str(input_path),
        "input_chars": len(text),
        "encoded_chars": len(sample),
        "embedding_dimension": int(len(embedding)),
        "load_seconds": round(load_seconds, 3),
        "encode_seconds": round(encode_seconds, 3),
        "embedding_preview": [round(float(value), 6) for value in embedding[:8]],
        "uses_paid_embedding_api": False,
        "allow_download": args.allow_download,
    }
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
