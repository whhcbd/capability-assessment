from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

try:
    import pysqlite3

    sys.modules["sqlite3"] = pysqlite3
except ImportError:
    pass

import chromadb
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer


DEFAULT_MODEL = "BAAI/bge-m3"
ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
PRIVATE_DATA_DIR = ROOT / "private-data"
INDEX_DIR = ROOT / "index" / "chroma"
OUTPUT_PATH = ROOT / "outputs" / "index-build-report.json"
COLLECTION_NAME = "capability_role_knowledge"
DEFAULT_EMBED_BATCH_SIZE = 64


def read_markdown_files(data_dir: Path) -> list[Path]:
    return sorted(path for path in data_dir.glob("*.md") if path.is_file())


def read_pdf_files(data_dir: Path) -> list[Path]:
    if not data_dir.exists():
        return []
    return sorted(path for path in data_dir.glob("*.pdf") if path.is_file())


def log(message: str) -> None:
    print(f"[build_index] {message}", flush=True)


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


def pdf_pages(path: Path) -> tuple[int, list[tuple[int, str]]]:
    reader = PdfReader(str(path))
    pages: list[tuple[int, str]] = []
    for page_index, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append((page_index, text))
    return len(reader.pages), pages


def build_documents(
    data_dir: Path,
    private_data_dir: Path,
    chunk_size: int,
    overlap: int,
) -> tuple[list[str], list[str], list[dict[str, Any]], dict[str, Any]]:
    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict[str, Any]] = []
    report: dict[str, Any] = {
        "markdown_files": [],
        "pdf_files": [],
        "pdf_total_pages": 0,
        "pdf_extractable_pages": 0,
        "pdf_empty_pages": 0,
        "markdown_chunks": 0,
        "pdf_chunks": 0,
    }

    markdown_files = read_markdown_files(data_dir)
    pdf_files = read_pdf_files(private_data_dir)

    log(f"Loading source files from {data_dir} and {private_data_dir}")
    log(f"Found {len(markdown_files)} markdown files and {len(pdf_files)} PDF files")

    for file_index, path in enumerate(markdown_files, start=1):
        log(f"Reading markdown {file_index}/{len(markdown_files)}: {path.name}")
        report["markdown_files"].append(path.name)
        text = path.read_text(encoding="utf-8")
        for index, chunk in enumerate(chunk_text(text, chunk_size, overlap), start=1):
            ids.append(f"{path.stem}-{index:03d}")
            documents.append(chunk)
            metadatas.append(
                {
                    "source_file": path.name,
                    "source_type": "markdown",
                    "chunk_index": index,
                    "chars": len(chunk),
                }
            )
            report["markdown_chunks"] += 1

    for file_index, path in enumerate(pdf_files, start=1):
        log(f"Reading PDF {file_index}/{len(pdf_files)}: {path.name}")
        report["pdf_files"].append(path.name)
        total_pages, pages = pdf_pages(path)
        report["pdf_total_pages"] += total_pages
        report["pdf_extractable_pages"] += len(pages)
        report["pdf_empty_pages"] += total_pages - len(pages)
        log(
            "PDF stats: "
            f"total_pages={total_pages}, extractable_pages={len(pages)}, empty_pages={total_pages - len(pages)}"
        )
        for page_number, text in pages:
            for chunk_index, chunk in enumerate(chunk_text(text, chunk_size, overlap), start=1):
                ids.append(f"{path.stem}-p{page_number:04d}-{chunk_index:03d}")
                documents.append(chunk)
                metadatas.append(
                    {
                        "source_file": path.name,
                        "source_type": "pdf",
                        "page_number": page_number,
                        "chunk_index": chunk_index,
                        "chars": len(chunk),
                    }
                )
                report["pdf_chunks"] += 1

    return ids, documents, metadatas, report


def encode_documents(
    model: SentenceTransformer,
    documents: list[str],
    batch_size: int,
) -> list[list[float]]:
    total = len(documents)
    total_batches = (total + batch_size - 1) // batch_size
    embeddings: list[list[float]] = []

    for batch_index, start in enumerate(range(0, total, batch_size), start=1):
        end = min(start + batch_size, total)
        log(
            "Embedding batch "
            f"{batch_index}/{total_batches} for chunks {start + 1}-{end}/{total}"
        )
        batch_embeddings = model.encode(
            documents[start:end],
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()
        embeddings.extend(batch_embeddings)

    return embeddings


def main() -> None:
    parser = argparse.ArgumentParser(description="Build local Chroma index for RAG spike.")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="SentenceTransformers model name.")
    parser.add_argument("--data-dir", type=Path, default=DATA_DIR, help="Markdown data directory.")
    parser.add_argument("--private-data-dir", type=Path, default=PRIVATE_DATA_DIR, help="Private PDF data directory.")
    parser.add_argument("--index-dir", type=Path, default=INDEX_DIR, help="Chroma persistent directory.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH, help="Build report output path.")
    parser.add_argument("--chunk-size", type=int, default=700, help="Chunk size in characters.")
    parser.add_argument("--overlap", type=int, default=80, help="Fallback character overlap.")
    parser.add_argument("--embed-batch-size", type=int, default=DEFAULT_EMBED_BATCH_SIZE, help="Embedding batch size.")
    parser.add_argument(
        "--allow-download",
        action="store_true",
        help="Allow downloading model files if they are not already cached locally.",
    )
    args = parser.parse_args()

    if not args.allow_download:
        os.environ["HF_HUB_OFFLINE"] = "1"

    started_at = time.perf_counter()
    log("Building chunk documents")
    ids, documents, metadatas, source_report = build_documents(
        args.data_dir,
        args.private_data_dir,
        args.chunk_size,
        args.overlap,
    )
    if not documents:
        raise RuntimeError(f"No markdown or PDF chunks found in {args.data_dir} or {args.private_data_dir}")
    log(
        "Chunk build complete: "
        f"markdown_chunks={source_report['markdown_chunks']}, "
        f"pdf_chunks={source_report['pdf_chunks']}, "
        f"total_chunks={len(documents)}"
    )

    log(f"Loading embedding model: {args.model}")
    model = SentenceTransformer(args.model, local_files_only=not args.allow_download)
    log("Model loaded; starting embeddings")
    embeddings = encode_documents(model, documents, args.embed_batch_size)
    log(f"Embeddings complete: {len(embeddings)} vectors")

    args.index_dir.mkdir(parents=True, exist_ok=True)
    log(f"Opening Chroma index at {args.index_dir}")
    client = chromadb.PersistentClient(path=str(args.index_dir))
    collection = client.get_or_create_collection(name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"})
    existing = collection.get(include=[])
    if existing.get("ids"):
        log(f"Deleting existing collection rows: {len(existing['ids'])}")
        collection.delete(ids=existing["ids"])
    log(f"Writing {len(ids)} chunks into collection {COLLECTION_NAME}")
    collection.add(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
    log("Chroma write complete")

    output = {
        "collection": COLLECTION_NAME,
        "model": args.model,
        "data_dir": str(args.data_dir.resolve()),
        "private_data_dir": str(args.private_data_dir.resolve()),
        "index_dir": str(args.index_dir.resolve()),
        "document_count": len(documents),
        "source_files": [path.name for path in read_markdown_files(args.data_dir)],
        "private_source_files": [path.name for path in read_pdf_files(args.private_data_dir)],
        "embedding_dimension": len(embeddings[0]),
        "embed_batch_size": args.embed_batch_size,
        "build_seconds": round(time.perf_counter() - started_at, 3),
        "uses_remote_vector_db": False,
        "allow_download": args.allow_download,
        **source_report,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"Build report written to {args.output}")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
