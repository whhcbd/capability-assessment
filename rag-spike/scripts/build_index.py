from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer


DEFAULT_MODEL = "BAAI/bge-m3"
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
INDEX_DIR = ROOT / "index" / "chroma"
OUTPUT_PATH = ROOT / "outputs" / "index-build-report.json"
COLLECTION_NAME = "capability_role_knowledge"


def read_markdown_files(data_dir: Path) -> list[Path]:
    return sorted(path for path in data_dir.glob("*.md") if path.is_file())


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    paragraphs = [paragraph.strip() for paragraph in text.split("\n\n") if paragraph.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= chunk_size:
            current = candidate
            continue
        if current:
            chunks.append(current)
        current = paragraph

    if current:
        chunks.append(current)

    expanded: list[str] = []
    for chunk in chunks:
        if len(chunk) <= chunk_size:
            expanded.append(chunk)
            continue
        start = 0
        while start < len(chunk):
            end = start + chunk_size
            expanded.append(chunk[start:end])
            start = max(end - overlap, end)

    return expanded


def build_documents(data_dir: Path, chunk_size: int, overlap: int) -> tuple[list[str], list[str], list[dict]]:
    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict] = []

    for path in read_markdown_files(data_dir):
        text = path.read_text(encoding="utf-8")
        for index, chunk in enumerate(chunk_text(text, chunk_size, overlap), start=1):
            ids.append(f"{path.stem}-{index:03d}")
            documents.append(chunk)
            metadatas.append(
                {
                    "source_file": path.name,
                    "chunk_index": index,
                    "chars": len(chunk),
                }
            )

    return ids, documents, metadatas


def main() -> None:
    parser = argparse.ArgumentParser(description="Build local Chroma index for RAG spike.")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="SentenceTransformers model name.")
    parser.add_argument("--data-dir", type=Path, default=DATA_DIR, help="Markdown data directory.")
    parser.add_argument("--index-dir", type=Path, default=INDEX_DIR, help="Chroma persistent directory.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH, help="Build report output path.")
    parser.add_argument("--chunk-size", type=int, default=700, help="Chunk size in characters.")
    parser.add_argument("--overlap", type=int, default=80, help="Fallback character overlap.")
    parser.add_argument(
        "--allow-download",
        action="store_true",
        help="Allow downloading model files if they are not already cached locally.",
    )
    args = parser.parse_args()

    if not args.allow_download:
        os.environ["HF_HUB_OFFLINE"] = "1"

    started_at = time.perf_counter()
    ids, documents, metadatas = build_documents(args.data_dir, args.chunk_size, args.overlap)
    if not documents:
        raise RuntimeError(f"No markdown chunks found in {args.data_dir}")

    model = SentenceTransformer(args.model, local_files_only=not args.allow_download)
    embeddings = model.encode(documents, normalize_embeddings=True).tolist()

    args.index_dir.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(args.index_dir))
    collection = client.get_or_create_collection(name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"})
    existing = collection.get(include=[])
    if existing.get("ids"):
        collection.delete(ids=existing["ids"])
    collection.add(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)

    output = {
        "collection": COLLECTION_NAME,
        "model": args.model,
        "data_dir": str(args.data_dir.resolve()),
        "index_dir": str(args.index_dir.resolve()),
        "document_count": len(documents),
        "source_files": [path.name for path in read_markdown_files(args.data_dir)],
        "embedding_dimension": len(embeddings[0]),
        "build_seconds": round(time.perf_counter() - started_at, 3),
        "uses_remote_vector_db": False,
        "allow_download": args.allow_download,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
