# Backend KORYXA Service IA

Fondations FastAPI du backend métier de Service IA.

## Authentification

Le service ne possède pas de système d'authentification local. L'identité est validée par la plateforme KORYXA en amont, puis transmise au backend avec le contexte suivant :

- `X-Tenant-ID`
- `X-User-ID`
- `X-Koryxa-Source`
- `X-Koryxa-Auth-Provider`
- `X-Koryxa-Role`
- `X-Koryxa-Permissions`

En production, ces en-têtes doivent uniquement être injectés par la passerelle ou le service KORYXA de confiance.

## Lancement local

```bash
cp .env.example .env
python -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]'
alembic upgrade head
uvicorn app.main:app --reload --port 8080
```

## Tests et qualité

```bash
pytest
ruff check .
mypy app
```

## Docker

```bash
docker compose up --build
```

## Endpoints disponibles

### Fondations

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/context/me`

### Organisations et membres

- `POST /api/v1/organizations`
- `GET /api/v1/organizations/current`
- `GET /api/v1/members`
- `PATCH /api/v1/members/{member_id}/role`
- `PATCH /api/v1/members/{member_id}/status`
- `POST /api/v1/invitations`
- `GET /api/v1/invitations`
- `POST /api/v1/invitations/{invitation_id}/revoke`
- `POST /api/v1/invitations/accept`

Les invitations n'ajoutent aucun mot de passe local. Elles rattachent un utilisateur déjà authentifié par KORYXA au tenant concerné.

### Registres métier

- `POST /api/v1/registers/offers`
- `GET /api/v1/registers/offers`
- `GET /api/v1/registers/offers/{id}`
- `PATCH /api/v1/registers/offers/{id}`
- `POST /api/v1/registers/sales`
- `GET /api/v1/registers/sales`
- `GET /api/v1/registers/sales/{id}`
- `PATCH /api/v1/registers/sales/{id}`
- `POST /api/v1/registers/procedures`
- `GET /api/v1/registers/procedures`
- `GET /api/v1/registers/procedures/{id}`
- `PATCH /api/v1/registers/procedures/{id}`
- `POST /api/v1/registers/{type}/{id}/archive`
- `GET /api/v1/registers/{type}/{id}/history`

Les listes prennent en charge la recherche, les filtres et la pagination. Toutes les requêtes restent isolées par organisation et tenant KORYXA.
