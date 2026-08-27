import os

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.db.session import engine

router = APIRouter()


@router.get("/health/live")
async def liveness() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "koryxa-service-ia",
        "commit": os.getenv("GIT_COMMIT", "dev"),
    }


@router.get("/health/ready")
async def readiness() -> JSONResponse:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unavailable",
                "checks": {"database": "failed"},
            },
        )
    return JSONResponse(content={"status": "ready", "checks": {"database": "ok"}})
