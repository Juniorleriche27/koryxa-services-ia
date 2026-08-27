import os

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text

from app.core.config import get_settings
from app.db.session import engine

router = APIRouter()


@router.get("/health/live")
async def liveness() -> dict[str, str]:
    settings = get_settings()
    commit_sha = os.getenv("GIT_COMMIT") or settings.git_commit or "dev"
    return {
        "status": "ok",
        "service": "koryxa-service-ia",
        "commit": commit_sha,
    }


@router.get("/health/ready")
async def readiness() -> JSONResponse:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
            required_tables = {
                "organizations",
                "organization_members",
                "sales",
                "offers",
                "procedures",
            }
            if os.getenv("SERVICE_IA_ENVIRONMENT") == "production":
                required_tables.add("alembic_version")
            available_tables = set(
                await connection.run_sync(
                    lambda sync_connection: inspect(sync_connection).get_table_names()
                )
            )
            missing_tables = sorted(required_tables - available_tables)
            if missing_tables:
                return JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    content={
                        "status": "unavailable",
                        "checks": {"database": "schema_incomplete"},
                        "missing_tables": missing_tables,
                    },
                )
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unavailable",
                "checks": {"database": "failed"},
            },
        )
    return JSONResponse(content={"status": "ready", "checks": {"database": "ok"}})
