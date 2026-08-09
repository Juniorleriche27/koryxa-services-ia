from __future__ import annotations

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class AIProviderType(str, Enum):
    NATIVE = "native"
    GEMINI = "gemini"
    OPENAI = "openai"
    COHERE = "cohere"
    GATEWAY = "gateway"
    KNOWLIA = "knowlia"


class AIConfigBase(BaseModel):
    provider: AIProviderType = Field(
        default=AIProviderType.NATIVE,
        description="Fournisseur d'intelligence actif (native, gemini, openai, cohere, gateway, knowlia)",
    )
    model_name: str = Field(
        default="koryxa-smart-v1",
        description="Nom du modèle (ex: gemini-1.5-pro, gpt-4o, command-r-plus, custom-llama3)",
    )
    api_base_url: str | None = Field(
        default=None,
        description="URL de base personnalisée pour AI Gateway ou serveur privé (ex: http://localhost:11434/v1)",
    )
    temperature: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Créativité du modèle (0.0 = très déterministe, 1.0 = très créatif)",
    )
    custom_system_prompt: str | None = Field(
        default=None,
        description="Consignes métier spécifiques pour personnaliser les réponses du copilote",
    )


class AIConfigUpdate(AIConfigBase):
    api_key: str | None = Field(
        default=None,
        description="Clé API pour le fournisseur externe (Gemini, OpenAI, Cohere ou Gateway privé)",
    )


class AIConfigRead(AIConfigBase):
    has_api_key: bool = Field(
        default=False,
        description="Indique si une clé API est déjà configurée pour ce locataire",
    )
    available_providers: list[dict[str, str]] = Field(
        default_factory=lambda: [
            {"id": "native", "name": "Moteur Autonome Koryxa (Intégré, Zéro Dépendance)", "description": "Analyses financières expertes, calculs de trésorerie et rédaction de relances natives"},
            {"id": "gemini", "name": "Google Gemini API", "description": "Modèles Gemini 1.5 Pro / Flash ultra-rapides et multimodaux"},
            {"id": "openai", "name": "OpenAI API", "description": "Modèles GPT-4o / GPT-4o-mini avec raisonnement avancé"},
            {"id": "cohere", "name": "Cohere API", "description": "Modèles Command R+ spécialisés en RAG et synthèse"},
            {"id": "gateway", "name": "Serveur Privé / Custom AI Gateway", "description": "Votre passerelle interne (Ollama, vLLM, LiteLLM, serveur d'entreprise)"},
            {"id": "knowlia", "name": "Moteur Knowlia Intelligence", "description": "Connecteur natif vers la base documentaire d'entreprise"},
        ]
    )


class ChatMessage(BaseModel):
    role: str = Field(..., description="Rôle du message: user, assistant ou system")
    content: str = Field(..., description="Contenu texte du message")


class AIChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., description="Historique des messages")
    include_financial_context: bool = Field(
        default=True,
        description="Injecter automatiquement les métriques réelles de l'entreprise (ventes, dépenses, trésorerie)",
    )
    include_radar_context: bool = Field(
        default=True,
        description="Injecter les alertes et constats du Radar de conformité",
    )


class SuggestedAction(BaseModel):
    title: str
    action_type: str  # e.g., "navigate", "create_sale", "create_expense", "run_radar", "send_reminder"
    payload: dict[str, Any] = Field(default_factory=dict)


class AIChatResponse(BaseModel):
    reply: str
    provider_used: str
    model_used: str
    suggested_actions: list[SuggestedAction] = Field(default_factory=list)


class PaymentReminderTone(str, Enum):
    COURTEOUS = "courteous"
    FIRM = "firm"
    LEGAL = "legal"


class PaymentReminderChannel(str, Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"


class PaymentReminderRequest(BaseModel):
    sale_id: str | None = None
    client_name: str
    amount: float
    currency: str = "XOF"
    reference: str
    overdue_days: int = 0
    tone: PaymentReminderTone = PaymentReminderTone.COURTEOUS
    channel: PaymentReminderChannel = PaymentReminderChannel.WHATSAPP
    payment_methods_info: str | None = None


class PaymentReminderResponse(BaseModel):
    subject: str | None = None
    body: str
    provider_used: str
    formatted_whatsapp_url: str | None = None


class ProcedureStepDraft(BaseModel):
    step_number: int
    title: str
    description: str
    role_responsible: str
    input_required: str | None = None
    output_produced: str | None = None


class ProcedureGenerationRequest(BaseModel):
    title: str
    description: str
    department: str = "Opérations"
    expected_steps_count: int = Field(default=4, ge=2, le=10)


class ProcedureGenerationResponse(BaseModel):
    title: str
    objective: str
    department: str
    prerequisites: list[str] = Field(default_factory=list)
    steps: list[ProcedureStepDraft]
    quality_checks: list[str] = Field(default_factory=list)
    provider_used: str
