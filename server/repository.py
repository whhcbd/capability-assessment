from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4


def utc_now() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


class AssessmentRepository:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_schema()

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def init_schema(self) -> None:
        with self.connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS assessment_sessions (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    resume_text TEXT NOT NULL,
                    target_role TEXT NOT NULL,
                    target_jd TEXT NOT NULL,
                    role_profile_json TEXT,
                    role_api_meta_json TEXT,
                    evidence_json TEXT,
                    capability_profile_json TEXT,
                    ability_api_meta_json TEXT,
                    questionnaire_answers_json TEXT,
                    status TEXT NOT NULL,
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    completed_at TEXT
                )
                """
            )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_assessment_sessions_student_updated
                ON assessment_sessions(student_id, updated_at DESC)
                """
            )

    def create_role_session(
        self,
        *,
        student_id: str,
        resume_text: str,
        target_role: str,
        target_jd: str,
        role_profile: dict[str, Any],
        role_api_meta: dict[str, Any],
    ) -> dict[str, Any]:
        now = utc_now()
        row_id = uuid4().hex
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO assessment_sessions (
                    id, student_id, resume_text, target_role, target_jd,
                    role_profile_json, role_api_meta_json, status,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    row_id,
                    student_id,
                    resume_text,
                    target_role,
                    target_jd,
                    json.dumps(role_profile, ensure_ascii=False),
                    json.dumps(role_api_meta, ensure_ascii=False),
                    "questionnaire_pending",
                    now,
                    now,
                ),
            )
        return self.get_by_id(row_id, student_id=student_id) or {}

    def get_by_id(self, assessment_id: str, *, student_id: str) -> dict[str, Any] | None:
        with self.connect() as connection:
            row = connection.execute(
                """
                SELECT * FROM assessment_sessions
                WHERE id = ? AND student_id = ?
                """,
                (assessment_id, student_id),
            ).fetchone()
        return self.deserialize(row) if row else None

    def get_latest_for_student(self, student_id: str) -> dict[str, Any] | None:
        with self.connect() as connection:
            row = connection.execute(
                """
                SELECT * FROM assessment_sessions
                WHERE student_id = ?
                ORDER BY updated_at DESC
                LIMIT 1
                """,
                (student_id,),
            ).fetchone()
        return self.deserialize(row) if row else None

    def complete_assessment(
        self,
        *,
        assessment_id: str,
        student_id: str,
        evidence: list[dict[str, Any]],
        capability_profile: dict[str, Any],
        ability_api_meta: dict[str, Any],
        questionnaire_answers: list[dict[str, Any]],
    ) -> dict[str, Any]:
        now = utc_now()
        with self.connect() as connection:
            connection.execute(
                """
                UPDATE assessment_sessions
                SET evidence_json = ?,
                    capability_profile_json = ?,
                    ability_api_meta_json = ?,
                    questionnaire_answers_json = ?,
                    status = ?,
                    error_message = NULL,
                    updated_at = ?,
                    completed_at = ?
                WHERE id = ? AND student_id = ?
                """,
                (
                    json.dumps(evidence, ensure_ascii=False),
                    json.dumps(capability_profile, ensure_ascii=False),
                    json.dumps(ability_api_meta, ensure_ascii=False),
                    json.dumps(questionnaire_answers, ensure_ascii=False),
                    "completed",
                    now,
                    now,
                    assessment_id,
                    student_id,
                ),
            )
        return self.get_by_id(assessment_id, student_id=student_id) or {}

    @staticmethod
    def deserialize(row: sqlite3.Row) -> dict[str, Any]:
        data = dict(row)
        for key in (
            "role_profile_json",
            "role_api_meta_json",
            "evidence_json",
            "capability_profile_json",
            "ability_api_meta_json",
            "questionnaire_answers_json",
        ):
            output_key = key.removesuffix("_json")
            raw_value = data.pop(key)
            data[output_key] = json.loads(raw_value) if raw_value else None
        return data
