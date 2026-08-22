"""Politeness Agent - Reusable tone, guardrail, and politeness gateway for RAG pipelines."""

from .config import (
    PolitenessConfig,
    Tone,
    Language,
    TriageCategory,
    TriageResult,
    PolishedResponse,
)
from .agent import PolitenessAgent

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
