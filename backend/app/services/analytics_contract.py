"""Contrat analytique CAURI v1 : résultat métier reproductible et sans flottants.

Les moteurs conservent les Decimal jusqu'à la frontière de sérialisation JSON.
Un indicateur indisponible n'est jamais assimilé à zéro.
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class MetricStatus(StrEnum):
    CALCULABLE = "calculable"
    INCOMPLETE = "incomplet"
    NOT_APPLICABLE = "non_applicable"
    INCOMPATIBLE = "incompatible"
    STALE = "obsolete"
    ERROR = "erreur"


class MetricResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    value: Decimal | None
    unit: str
    currency: str | None = None
    period: str = "all_time"
    organization_id: str
    formula_version: str = "1"
    status: MetricStatus
    reason: str | None = None
    sources: list[str] = Field(default_factory=list)
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode="after")
    def validate_status(self) -> "MetricResult":
        if self.status == MetricStatus.CALCULABLE and self.value is None:
            raise ValueError("Un résultat calculable exige une valeur numérique")
        if self.status != MetricStatus.CALCULABLE and self.value is not None:
            raise ValueError("Un résultat indisponible ne peut pas porter une valeur")
        if self.value is not None and not self.value.is_finite():
            raise ValueError("Les valeurs infinies ou NaN sont interdites")
        if self.currency and (len(self.currency) != 3 or self.currency != self.currency.upper()):
            raise ValueError("La devise doit être un code ISO majuscule de trois lettres")
        return self


def exact_decimal(value: Any) -> Decimal:
    """Convertit les entrées à la frontière, rejette float/NaN/Infinity."""
    if isinstance(value, bool) or isinstance(value, float):
        raise ValueError("Les floats et booléens sont interdits dans les calculs métier")
    try:
        number = value if isinstance(value, Decimal) else Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError("Montant numérique invalide") from exc
    if not number.is_finite():
        raise ValueError("Valeur non finie interdite")
    return number


def round_money(value: Decimal, places: int = 2) -> Decimal:
    if not 0 <= places <= 6:
        raise ValueError("Précision monétaire non prise en charge")
    return exact_decimal(value).quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
