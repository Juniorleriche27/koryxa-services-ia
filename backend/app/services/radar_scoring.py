"""Deterministic CAURI Radar quality score; independent of UI alert pagination."""
from collections import Counter
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable

WEIGHTS = {"completeness": Decimal("0.35"), "freshness": Decimal("0.25"), "consistency": Decimal("0.25"), "traceability": Decimal("0.15")}
PENALTY = {"completeness": 8, "freshness": 8, "consistency": 10, "traceability": 6}
CAP = {"completeness": 30, "freshness": 25, "consistency": 25, "traceability": 20}


def radar_quality_score(dimensions: Iterable[str]) -> dict:
    counts = Counter(str(getattr(d, "value", d)).lower() for d in dimensions)
    per_dimension = {key: max(0, 100 - min(CAP[key], counts[key] * PENALTY[key])) for key in WEIGHTS}
    weighted = sum((Decimal(per_dimension[key]) * weight for key, weight in WEIGHTS.items()), Decimal(0))
    return {
        "global_score": int(weighted.quantize(Decimal("1"), rounding=ROUND_HALF_UP)),
        "dimensions": per_dimension,
        "alert_counts": {key: counts[key] for key in WEIGHTS},
        "metric_type": "data_quality_alerts",
        "scoring_version": "1",
    }
