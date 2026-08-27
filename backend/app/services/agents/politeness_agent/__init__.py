"""Politeness Agent - Reusable tone, guardrail, and politeness gateway for RAG pipelines."""

from .agent import PolitenessAgent
from .config import (
    Language,
    PolishedResponse,
    PolitenessConfig,
    Tone,
    TriageCategory,
    TriageResult,
)

__version__ = "1.0.0"

__all__ = [
    "PolitenessAgent",
    "PolitenessConfig",
    "Tone",
    "Language",
    "TriageCategory",
    "TriageResult",
    "PolishedResponse",
]
