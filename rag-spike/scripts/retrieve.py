from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

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
OUTPUT_PATH = ROOT / "outputs" / "retrieve-results.json"
COLLECTION_NAME = "capability_role_knowledge"


def main() -> None:
    parser = argparse.ArgumentParser(description="Retrieve local RAG chunks from Chroma.")
    parser.add_argument("query", help="Role name or JD text to retrieve relevant chunks for.")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="SentenceTransformers model name.")
    parser.add_argument("--index-dir", type=Path, default=INDEX_DIR, help="Chroma persistent directory.")
    parser.add_argument("--top-k", type=int, default=5, help="Number of chunks to retrieve.")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH, help="Retrieve result output path.")
    parser.add_argument(
        "--allow-download",
        action="store_true",
        help="Allow downloading model files if they are not already cached locally.",
    )
    args = parser.parse_args()

    if not args.allow_download:
        os.environ["HF_HUB_OFFLINE"] = "1"

    model = SentenceTransformer(args.model, local_files_only=not args.allow_download)
    query_embedding = model.encode([args.query], normalize_embeddings=True).tolist()[0]

    client = chromadb.PersistentClient(path=str(args.index_dir))
    collection = client.get_collection(name=COLLECTION_NAME)
    result = collection.query(query_embeddings=[query_embedding], n_results=args.top_k)

    matches = []
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

    output = {
        "query": args.query,
        "model": args.model,
        "index_dir": str(args.index_dir.resolve()),
        "top_k": args.top_k,
        "matches": matches,
        "uses_remote_vector_db": False,
        "allow_download": args.allow_download,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
