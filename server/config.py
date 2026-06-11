from __future__ import annotations

import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class Settings:
    app_name = "Capability Assessment API"
    host = os.environ.get("CAPABILITY_API_HOST", "127.0.0.1")
    port = int(os.environ.get("CAPABILITY_API_PORT", "8770"))
    database_path = Path(
        os.environ.get(
            "CAPABILITY_ASSESSMENT_DB",
            str(ROOT / "data" / "capability-assessment.sqlite3"),
        )
    )
    cors_origins = [
        origin.strip()
        for origin in os.environ.get(
            "CAPABILITY_API_CORS_ORIGINS",
            "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174,http://localhost:5174",
        ).split(",")
        if origin.strip()
    ]


settings = Settings()
