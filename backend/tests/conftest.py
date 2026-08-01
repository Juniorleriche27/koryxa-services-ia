import os

os.environ.setdefault("SERVICE_IA_ENVIRONMENT", "test")
os.environ.setdefault("SERVICE_IA_DATABASE_URL", "sqlite+aiosqlite:///:memory:")
