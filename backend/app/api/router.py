from fastapi import APIRouter

from app.api.routes import health, identity, invitations, members, organizations

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(identity.router, prefix="/context", tags=["context"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(members.router, prefix="/members", tags=["members"])
api_router.include_router(invitations.router, prefix="/invitations", tags=["invitations"])
