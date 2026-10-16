"""Radar duplicate detection remains correct and avoids n² on distinct references."""
from datetime import date
from decimal import Decimal
from time import perf_counter
from types import SimpleNamespace

from app.services.radar import duplicate_candidates


def sale(i, ref=None, client=None):
    return SimpleNamespace(reference=ref if ref is not None else f"REF-{i}",
        client_name=client, item_label="Item", total_amount=Decimal(i), sale_date=date(2026, 10, 16))


def test_reference_bucketing_excludes_non_candidates():
    entries = [sale(i) for i in range(1800)]
    t = perf_counter()
    assert list(duplicate_candidates(entries, 0.75, 1)) == []
    assert perf_counter() - t < 2.0
    entries[17].reference = entries[12].reference
    pairs = list(duplicate_candidates(entries, 0.75, 1))
    assert len(pairs) == 1
    assert pairs[0][0].reference == pairs[0][1].reference


def test_lower_threshold_preserves_nonreference_candidates():
    entries = [sale(5, client="Client A"), sale(5, ref="other", client="Client A")]
    entries[1].reference = "completely-different"
    matches = list(duplicate_candidates(entries, 0.5, 1))
    assert len(matches) == 1
