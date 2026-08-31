from __future__ import annotations

from enum import StrEnum
from typing import Any

from sqlalchemy.types import String, TypeDecorator


class SafeStrEnum(TypeDecorator):
    """Case-insensitive, resilient StrEnum type decorator.

    Reads both uppercase ('PAID', 'VALIDATED') and lowercase ('paid', 'validated') values
    from database columns and safely converts them to the target Python StrEnum.
    """

    impl = String(40)
    cache_ok = True

    def __init__(
        self, enum_cls: type[StrEnum], length: int = 40, *args: Any, **kwargs: Any
    ) -> None:
        super().__init__(*args, **kwargs)
        self.impl = String(length)
        self.enum_cls = enum_cls

    def process_bind_param(self, value: Any, dialect: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, self.enum_cls):
            return value.value
        return str(value).lower()

    def process_result_value(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return None
        val_lower = str(value).strip().lower()
        for member in self.enum_cls:
            if member.value.lower() == val_lower or member.name.lower() == val_lower:
                return member
        # If no exact match, fallback gracefully
        try:
            return self.enum_cls(val_lower)
        except Exception:
            return list(self.enum_cls)[0]
