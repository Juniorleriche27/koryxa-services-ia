import hmac
import time
from collections import defaultdict
from uuid import uuid4

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        request.state.request_id = request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        logger.info("request_completed", status_code=response.status_code)
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Protection anti-abus et rate limiting par IP / Tenant avec fenêtre glissante."""

    def __init__(
        self,
        app: object,
        max_general_per_minute: int = 120,
        max_ai_per_minute: int = 30,
    ) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self.max_general = max_general_per_minute
        self.max_ai = max_ai_per_minute
        self._requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        path = request.url.path

        if get_settings().environment == "test":
            return await call_next(request)

        # Endpoints exemptés
        if path.startswith("/api/v1/health") or path.startswith("/docs") or path.startswith("/openapi"):
            return await call_next(request)

        # Clé de limitation : Tenant ID si présent, sinon IP client
        tenant_id = request.headers.get("X-Tenant-ID")
        supplied_secret = request.headers.get("X-Koryxa-Proxy-Secret")
        configured_secret = get_settings().proxy_secret
        client_ip = request.client.host if request.client else "unknown"
        trusted_tenant = bool(
            configured_secret
            and supplied_secret
            and hmac.compare_digest(supplied_secret, configured_secret)
        )
        rate_key = (
            f"tenant:{tenant_id}"
            if trusted_tenant and tenant_id and tenant_id != "anonymous"
            else f"ip:{client_ip}"
        )

        now = time.time()
        window_start = now - 60.0

        # Déterminer la limite applicable
        is_ai_or_voice = "/voice/" in path or "/ai/" in path
        limit = self.max_ai if is_ai_or_voice else self.max_general
        tracker_key = f"{rate_key}:ai" if is_ai_or_voice else f"{rate_key}:general"

        # Nettoyage de la fenêtre glissante
        timestamps = [ts for ts in self._requests[tracker_key] if ts > window_start]
        self._requests[tracker_key] = timestamps

        if len(timestamps) >= limit:
            logger.warning("rate_limit_exceeded", tracker_key=tracker_key, limit=limit, path=path)
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "rate_limit_exceeded",
                        "message": "Trop de requêtes. Veuillez patienter avant de réessayer.",
                    }
                },
                headers={"Retry-After": "60"},
            )

        self._requests[tracker_key].append(now)
        return await call_next(request)
