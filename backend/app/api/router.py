from fastapi import APIRouter

from app.api.routes import (
    health,
    direct_uploads,
    identity,
    imports,
    invitations,
    knowlia,
    members,
    organizations,
    radar,
    registers,
    voice,
    whatsapp,
    workflow,
    ai,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(identity.router, prefix="/context", tags=["context"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(members.router, prefix="/members", tags=["members"])
api_router.include_router(invitations.router, prefix="/invitations", tags=["invitations"])

api_router.include_router(registers.router, prefix="/registers", tags=["registers"])
api_router.include_router(voice.router, prefix="/voice", tags=["voice"])
api_router.include_router(whatsapp.router, prefix="/integrations/whatsapp", tags=["whatsapp"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])

api_router.include_router(imports.router, prefix="/imports", tags=["imports-files"])

api_router.include_router(direct_uploads.router, prefix="/direct-uploads", tags=["direct-uploads"])

api_router.include_router(knowlia.router, prefix="/knowlia", tags=["knowlia"])

api_router.include_router(radar.router, prefix="/radar", tags=["radar"])

api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])

