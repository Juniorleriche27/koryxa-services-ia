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

### Import, export et fichiers

- `POST /api/v1/imports/preview`
- `POST /api/v1/imports/{job_id}/confirm`
- `POST /api/v1/imports/{job_id}/rollback`
- `GET /api/v1/imports/export/{register_type}`
- `POST /api/v1/imports/attachments`
- `GET /api/v1/imports/attachments`

Les imports acceptent CSV et XLSX, proposent une correspondance de colonnes, affichent un aperçu, signalent les doublons probables et produisent un rapport d'erreurs. Les pièces jointes utilisent une abstraction de stockage locale configurable et restent isolées par tenant.

### Connecteur Knowlia

- `POST /api/v1/knowlia/sync`
- `GET /api/v1/knowlia/sync/{sync_id}`
- `POST /api/v1/knowlia/sync/{sync_id}/refresh`
- `POST /api/v1/knowlia/sync/{sync_id}/retry`

Le connecteur utilise le contrat réel de Knowlia : enregistrement d'une référence OpenCloud via `/v1/documents/opencloud-references`, puis lancement et suivi de l'ingestion via `/v1/documents/{document_id}/ingestions`.

Configuration :

- `SERVICE_IA_KNOWLIA_BASE_URL`
- `SERVICE_IA_KNOWLIA_TIMEOUT_SECONDS`

Le contexte KORYXA, l'identifiant de requête et les permissions Knowlia sont propagés côté serveur. Les synchronisations utilisent une clé d'idempotence, un journal d'état, un compteur de tentatives et une reprise contrôlée.

### Knowlia Radar déterministe

- `GET /api/v1/radar/rules`
- `PUT /api/v1/radar/rules/{code}`
- `POST /api/v1/radar/document-facts`
- `POST /api/v1/radar/runs`
- `GET /api/v1/radar/alerts`
- `PATCH /api/v1/radar/alerts/{alert_id}`

Radar applique des règles explicables et configurables sur les offres, ventes et procédures. Chaque exécution produit des scores de complétude, fraîcheur, cohérence et traçabilité, ainsi que des alertes persistées avec priorité, preuves, recommandation et niveau de confiance.

Les doublons restent des suspicions soumises à validation humaine. Les écarts documentaires ne sont évalués que lorsqu'une donnée structurée provenant d'un document existe.
