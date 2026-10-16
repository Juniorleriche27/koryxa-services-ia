"""CAURI institutional departments catalogue. No parallel permissions engine."""
from __future__ import annotations

from typing import Any
from app.core.permissions import ROLE_PERMISSIONS
from app.models.member import MemberRole

# Slugs and destinations mirror existing /espace pages and backend modules.
# Availability means implemented; access is evaluated independently per member.
DEPARTMENTS = (
    {"id": "direction", "label": "Direction et pilotage", "path": "/espace", "modules": ("dashboard", "grand_hall"), "permission": "registers:read"},
    {"id": "commerce", "label": "Commerce et ventes", "path": "/espace/ventes", "modules": ("sales", "offers", "suppliers"), "permission": "registers:read"},
    {"id": "finances", "label": "Finances et trésorerie", "path": "/espace/finance", "modules": ("expenses", "cash_register", "finance_accounts"), "permission": "registers:read"},
    {"id": "operations", "label": "Opérations et procédures", "path": "/espace/procedures", "modules": ("procedures", "workflows"), "permission": "workflow:read"},
    {"id": "organisation", "label": "Membres et organisation", "path": "/espace/equipe", "modules": ("members", "attendance", "organization"), "permission": "members:read"},
    {"id": "radar", "label": "Radar et contrôle", "path": "/espace/radar", "modules": ("radar", "alerts", "quality"), "permission": "radar:read"},
)


def department_catalogue(organization_id: str, role: MemberRole | str) -> dict[str, Any]:
    role = MemberRole(role)
    granted = ROLE_PERMISSIONS.get(role, frozenset())
    return {
        "schema_version": "1.0",
        "organization_id": organization_id,
        "departments": [
            {
                "id": d["id"], "label": d["label"], "path": d["path"],
                "modules": list(d["modules"]), "required_permission": d["permission"],
                "available": True,
                "allowed": role == MemberRole.OWNER or d["permission"] in granted,
                "availability_reason": "module_backend_disponible",
                "access_status": "autorise" if (role == MemberRole.OWNER or d["permission"] in granted) else "interdit",
                "availability_scope": "backend_module_only",
            }
            for d in DEPARTMENTS
        ],
    }
