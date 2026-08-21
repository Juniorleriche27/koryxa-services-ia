import json
from app.main import app

schema = app.openapi()
components = schema.get("components", {}).get("schemas", {})
print("BUSINESS PROFILE SCHEMA:")
print(json.dumps(components.get("BusinessProfile", {}), indent=2))
