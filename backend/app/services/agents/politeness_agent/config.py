"""Configuration models for the Politeness Agent."""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Tone(str, Enum):
    """Supported tone styles for communication."""

    FORMAL = "formal"  # Strict vouvoiement, corporate and professional
    WARM = "warm"  # Warm vouvoiement, customer-centric and empathetic
    CASUAL = "casual"  # Tutoiement, friendly, tech/startup style
    CONCISE = "concise"  # Minimalist politeness without unnecessary small talk


class Language(str, Enum):
    """Supported primary languages."""

    FR = "fr"
    EN = "en"
    ES = "es"
    PT = "pt"
    AR = "ar"


class TriageCategory(str, Enum):
    """Categorization of incoming user messages."""

    GREETING = "greeting"  # Pure hello / greetings
    FAREWELL = "farewell"  # Goodbye / thank you & leave
    GRATITUDE = "gratitude"  # Thank you / thanks
    CHITCHAT = "chitchat"  # How are you? / small talk
    INAPPROPRIATE = "inappropriate"  # Toxicity / aggressive remarks
    RAG_QUERY = "rag_query"  # Business question needing document retrieval


class PolitenessConfig(BaseModel):
    """Global configuration settings for politeness and tone handling."""

    tone: Tone = Field(default=Tone.WARM, description="Tone style to apply")
    language: Language = Field(default=Language.FR, description="Primary language")
    assistant_name: str | None = Field(default=None, description="Name of the AI assistant")
    company_name: str | None = Field(
        default=None, description="Company/brand name for custom phrasing"
    )
    user_name: str | None = Field(
        default=None, description="User or leader name for personalized phrasing"
    )

    # Behavior switches
    auto_greet: bool = Field(
        default=True, description="Add initial greeting if user greeted or first interaction"
    )
    add_signoff: bool = Field(
        default=False, description="Add polite signoff at the end of the response"
    )
    soften_no_results: bool = Field(
        default=True, description="Replace dry 'Not found' with diplomatic polite responses"
    )
    sanitize_rag_queries: bool = Field(
        default=True, description="Strip conversational noise before vector search"
    )

    # Custom templates
    custom_fallback_message: str | None = Field(
        default=None, description="Custom message when the RAG system finds no information"
    )
    custom_greeting_template: str | None = Field(
        default=None, description="Custom greeting message template"
    )

    def format_text(self, text: str) -> str:
        """Safely formats dynamic placeholders in text."""
        u_name = self.user_name or ""
        c_name = self.company_name or ""
        a_name = self.assistant_name or ""
        res = (
            text.replace("{user_name}", u_name)
            .replace("{company_name}", c_name)
            .replace("{assistant_name}", a_name)
        )
        import re

        return re.sub(r"  +", " ", res).strip()


class TriageResult(BaseModel):
    """Result of the pre-RAG triage step."""

    is_rag_query: bool = Field(
        description="True if the message should proceed to vector DB retrieval"
    )
    category: TriageCategory = Field(description="Identified category")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score")
    direct_response: str | None = Field(
        default=None, description="Immediate polite response if is_rag_query is False"
    )
    sanitized_query: str | None = Field(
        default=None, description="Query cleaned of conversational fluff for vector search"
    )
    detected_user_greeting: bool = Field(
        default=False, description="Whether the user included a greeting in the message"
    )


class PolishedResponse(BaseModel):
    """Result of the post-RAG polishing step."""

    final_text: str = Field(description="Polite, tone-aligned final response")
    tone_applied: Tone = Field(description="The tone applied")
    was_softened: bool = Field(
        default=False, description="Whether a no-context response was softened"
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict, description="Additional debug/analytics metadata"
    )
