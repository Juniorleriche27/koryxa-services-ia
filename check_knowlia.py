import json
from app.main import app

schema = app.openapi()
paths = schema.get("paths", {})
assistants_post = paths.get("/v1/assistants", {}).get("post", {})
print("ASSISTANTS POST SCHEMA:")
print(json.dumps(assistants_post, indent=2))

components = schema.get("components", {}).get("schemas", {})
for name, comp in components.items():
    if "assistant" in name.lower():
        print(f"SCHEMA {name}:")
        print(json.dumps(comp, indent=2))
