"""FastAPI microservice offering HTTP endpoints for the Politeness Gateway."""

from typing import Any

from pydantic import BaseModel, Field

from .agent import PolitenessAgent
from .config import (
    PolishedResponse,
    PolitenessConfig,
    TriageResult,
)

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False


def create_app(config: PolitenessConfig | None = None) -> Any:
    """Factory creating the FastAPI instance."""
    if not FASTAPI_AVAILABLE:
        raise ImportError(
            "FastAPI and uvicorn are required to run the HTTP server. "
            "Please install with: pip install fastapi uvicorn"
        )

    agent = PolitenessAgent(config=config or PolitenessConfig())

    app = FastAPI(
        title="Politeness & Tone Gateway for RAG",
        description="Microservice ensuring politeness, tone harmonization, and intent triage across all RAG apps.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class TriageRequest(BaseModel):
        query: str = Field(..., description="User input message")
        config_override: PolitenessConfig | None = None

    class SanitizeRequest(BaseModel):
        query: str = Field(..., description="Raw query with pleasantries")

    class PolishRequest(BaseModel):
        raw_response: str = Field(..., description="Raw response produced by RAG LLM")
        query: str | None = Field(None, description="Original user query")
        context_found: bool = Field(True, description="Whether matching documents were retrieved")
        user_greeted: bool = Field(False, description="Whether user started with a greeting")
        config_override: PolitenessConfig | None = None

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "politeness-agent"}

    @app.post("/triage", response_model=TriageResult)
    def triage_endpoint(req: TriageRequest):
        local_agent = agent
        if req.config_override:
            local_agent = PolitenessAgent(config=req.config_override)
        return local_agent.triage(req.query)

    @app.post("/sanitize")
    def sanitize_endpoint(req: SanitizeRequest):
        return {"sanitized_query": agent.sanitize(req.query)}

    @app.post("/polish", response_model=PolishedResponse)
    def polish_endpoint(req: PolishRequest):
        local_agent = agent
        if req.config_override:
            local_agent = PolitenessAgent(config=req.config_override)
        return local_agent.polish(
            raw_rag_response=req.raw_response,
            query=req.query,
            context_found=req.context_found,
            user_greeted=req.user_greeted,
        )

    return app


# Default app instance for uvicorn run
if FASTAPI_AVAILABLE:
    app = create_app()
else:
    app = None
