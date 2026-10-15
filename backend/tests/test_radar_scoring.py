"""Full-population, deterministic Radar scoring invariants."""
from app.services.radar_scoring import radar_quality_score


def test_no_alerts_yields_full_data_quality_score_not_financial_profit():
    score = radar_quality_score([])
    assert score["global_score"] == 100
    assert score["metric_type"] == "data_quality_alerts"


def test_dimension_weights_are_stable():
    score = radar_quality_score(["completeness", "freshness", "consistency", "traceability"])
    assert score["dimensions"] == {"completeness": 92, "freshness": 92, "consistency": 90, "traceability": 94}
    assert score["global_score"] == 92


def test_cap_and_pagination_do_not_drop_alerts():
    score = radar_quality_score(["completeness"] * 30)
    assert score["alert_counts"]["completeness"] == 30
    assert score["dimensions"]["completeness"] == 70
    assert score["global_score"] == 90


def test_unknown_dimension_is_ignored_and_order_independent():
    a = radar_quality_score(["freshness", "consistency", "unknown"])
    b = radar_quality_score(["consistency", "freshness"])
    assert a["global_score"] == b["global_score"]
