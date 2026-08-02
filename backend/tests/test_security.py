from fastapi.testclient import TestClient

from app.main import app


def test_security_headers_are_present() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health/live")

    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert response.headers["Cross-Origin-Resource-Policy"] == "same-site"
    assert "camera=()" in response.headers["Permissions-Policy"]
