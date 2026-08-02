from __future__ import annotations

from pathlib import Path
from uuid import uuid4


class LocalFileStorage:
    def __init__(self, base_path: str) -> None:
        self.base = Path(base_path)

    def save(self, organization_id: str, filename: str, content: bytes) -> str:
        safe = Path(filename).name
        key = f"{organization_id}/{uuid4()}-{safe}"
        path = self.base / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return key

    def read(self, key: str) -> bytes:
        path = (self.base / key).resolve()
        if self.base.resolve() not in path.parents:
            raise ValueError("storage key invalide")
        return path.read_bytes()

    def delete(self, key: str) -> None:
        path = (self.base / key).resolve()
        if self.base.resolve() in path.parents and path.exists():
            path.unlink()
