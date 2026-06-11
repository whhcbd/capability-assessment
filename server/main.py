from __future__ import annotations

import argparse
from typing import Annotated

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .repository import AssessmentRepository
from .schemas import (
    AssessmentResponse,
    CapabilityEvidenceRequest,
    ResumeTextResponse,
    RoleProfileRequest,
)
from .script_adapters import extract_resume_text
from .service import AssessmentService


repository = AssessmentRepository(settings.database_path)
service = AssessmentService(repository)

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Student-Id"],
)


def current_student_id(x_student_id: Annotated[str | None, Header()] = None) -> str:
    student_id = (x_student_id or "demo_user_001").strip()
    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "X-Student-Id is required."},
        )
    return student_id


def to_assessment_response(session: dict) -> AssessmentResponse:
    return AssessmentResponse(
        assessment_id=session["id"],
        student_id=session["student_id"],
        status=session["status"],
        target_role=session["target_role"],
        target_jd=session["target_jd"],
        role_profile=session.get("role_profile"),
        role_api_meta=session.get("role_api_meta"),
        evidence=session.get("evidence"),
        capability_profile=session.get("capability_profile"),
        ability_api_meta=session.get("ability_api_meta"),
        questionnaire_answers=session.get("questionnaire_answers"),
        created_at=session["created_at"],
        updated_at=session["updated_at"],
        completed_at=session.get("completed_at"),
    )


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "ok": True,
        "service": "capability-assessment-api",
        "database_path": str(settings.database_path),
        "endpoints": [
            "/resume-text",
            "/assessments/role-profile",
            "/assessments/capability-evidence",
            "/assessments/me/latest",
        ],
    }


@app.post("/resume-text", response_model=ResumeTextResponse)
async def resume_text(file: Annotated[UploadFile, File()]) -> ResumeTextResponse:
    try:
        data = await file.read()
        return ResumeTextResponse(**extract_resume_text(file.filename or "resume", data))
    except Exception as error:  # noqa: BLE001 - return user-facing upload errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": str(error), "extraction_status": "failed"},
        ) from error


@app.post("/assessments/role-profile", response_model=AssessmentResponse)
def role_profile(
    request: RoleProfileRequest,
    student_id: Annotated[str, Depends(current_student_id)],
) -> AssessmentResponse:
    try:
        session = service.create_role_profile(student_id=student_id, request=request)
        return to_assessment_response(session)
    except Exception as error:  # noqa: BLE001 - convert AI/RAG errors to API response
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": str(error)},
        ) from error


@app.post("/assessments/capability-evidence", response_model=AssessmentResponse)
def capability_evidence(
    request: CapabilityEvidenceRequest,
    student_id: Annotated[str, Depends(current_student_id)],
) -> AssessmentResponse:
    try:
        session = service.complete_questionnaire(student_id=student_id, request=request)
        return to_assessment_response(session)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": str(error)},
        ) from error
    except Exception as error:  # noqa: BLE001 - convert AI scoring errors to API response
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": str(error)},
        ) from error


@app.get("/assessments/me/latest", response_model=AssessmentResponse | None)
def latest_assessment(
    student_id: Annotated[str, Depends(current_student_id)],
) -> AssessmentResponse | None:
    session = repository.get_latest_for_student(student_id)
    return to_assessment_response(session) if session else None


def main() -> None:
    parser = argparse.ArgumentParser(description="Run capability assessment product API.")
    parser.add_argument("--host", default=settings.host)
    parser.add_argument("--port", type=int, default=settings.port)
    args = parser.parse_args()

    import uvicorn

    uvicorn.run("server.main:app", host=args.host, port=args.port, reload=False)


if __name__ == "__main__":
    main()
