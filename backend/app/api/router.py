from fastapi import APIRouter

from app.api.routes import health, identity

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(identity.router, prefix="/context", tags=["context"])
