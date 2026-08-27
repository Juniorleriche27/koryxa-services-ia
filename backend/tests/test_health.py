from fastapi.testclient import TestClient

from app.main import app


def test_liveness() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health/live")
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "koryxa-service-ia"
    assert "commit" in data


def test_readiness() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    assert response.json()["checks"]["database"] == "ok"
