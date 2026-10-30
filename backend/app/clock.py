from __future__ import annotations

from datetime import UTC, datetime


def utc_now() -> datetime:
    """Provide the current UTC time at the application boundary."""
    return datetime.now(UTC)


def as_utc(value: datetime) -> datetime:
    """Normalize an injected timestamp to UTC; naive values are interpreted as UTC."""
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
