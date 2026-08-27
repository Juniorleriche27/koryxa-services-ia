"""Main PolitenessAgent orchestrator providing unified methods for RAG pipelines."""

from collections.abc import Callable
from typing import Any

from .config import (
    PolishedResponse,
    PolitenessConfig,
    TriageResult,
)
from .formatter import ResponsePolisher
from .sanitizer import QuerySanitizer
from .triage import FastTriageEngine


class PolitenessAgent:
    """
    Politeness, Tone, and Guardrail Gateway for RAG Systems.

    Provides pre-RAG triage, query sanitization, and post-RAG tone harmonization.
    """

    def __init__(self, config: PolitenessConfig | None = None):
        self.config = config or PolitenessConfig()
        self.triage_engine = FastTriageEngine(self.config)
        self.sanitizer = QuerySanitizer()
        self.polisher = ResponsePolisher(self.config)

    def update_config(self, **kwargs) -> None:
        """Update agent configuration dynamically."""
        current_data = self.config.model_dump()
        current_data.update(kwargs)
        self.config = PolitenessConfig(**current_data)
        self.triage_engine = FastTriageEngine(self.config)
        self.polisher = ResponsePolisher(self.config)

    def triage(self, query: str) -> TriageResult:
        """
        Classify incoming user query.
        If the query is pure greeting/farewell/gratitude, is_rag_query will be False
        and direct_response will contain the immediate polite response.
        """
        result = self.triage_engine.triage(query)
        if result.is_rag_query and self.config.sanitize_rag_queries:
            result.sanitized_query = self.sanitizer.sanitize(query)
        else:
            result.sanitized_query = query
        return result

    def sanitize(self, query: str) -> str:
        """
        Strips conversational pleasantries to produce an optimal semantic query for Vector DB.
        """
        return self.sanitizer.sanitize(query)

    def polish(
        self,
        raw_rag_response: str,
        query: str | None = None,
        context_found: bool = True,
        user_greeted: bool = False,
    ) -> PolishedResponse:
        """
        Applies politeness, tone, and diplomatic fallbacks to the raw LLM synthesis.
        """
        return self.polisher.polish(
            raw_rag_response=raw_rag_response,
            query=query,
            context_found=context_found,
            user_greeted=user_greeted,
        )

    def execute_rag(
        self,
        user_input: str,
        retriever_fn: Callable[[str], Any],
        generator_fn: Callable[[str, Any], str],
    ) -> str:
        """
        Convenience wrapper that runs the entire pipeline with all politeness guardrails:
        1. Triage (intercepts greetings/farewells/chitchat instantly)
        2. Query Sanitization (cleans search query for Vector DB)
        3. Vector DB Retrieval (calls user's retriever_fn)
        4. LLM Generation (calls user's generator_fn)
        5. Output Polishing (formats response, fixes tone, softens missing results)

        Args:
            user_input: Raw query from user.
            retriever_fn: Function taking a cleaned query and returning retrieved documents/context.
            generator_fn: Function taking (clean_query, context) and returning raw LLM string.
        """
        # Step 1: Pre-RAG Triage
        triage_res = self.triage(user_input)
        if not triage_res.is_rag_query:
            return triage_res.direct_response or "Bonjour !"

        # Step 2: Query Sanitization
        clean_query = triage_res.sanitized_query or user_input

        # Step 3: Retrieval
        context = retriever_fn(clean_query)
        context_found = bool(context)

        # Step 4: Generation
        if not context_found:
            raw_response = ""
        else:
            raw_response = generator_fn(clean_query, context)

        # Step 5: Post-RAG Polishing
        polished = self.polish(
            raw_rag_response=raw_response,
            query=user_input,
            context_found=context_found,
            user_greeted=triage_res.detected_user_greeting,
        )

        return polished.final_text
