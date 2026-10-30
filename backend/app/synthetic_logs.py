from __future__ import annotations

from typing import TypedDict


class LogEvent(TypedDict):
    at: str
    source: str
    user: str
    event: str
    url: str | None
    detail: str


# Synthetic proxy and sign-in events for the demo tenant. All hosts use reserved
# example domains and TEST-NET addresses; nothing here describes a real system.
SYNTHETIC_LOGS: tuple[LogEvent, ...] = (
    {
        "at": "2026-10-30T09:42:11Z",
        "source": "web-proxy",
        "user": "j.rao@company.example",
        "event": "HTTP GET",
        "url": "https://passwrd-reset-secure.example/login",
        "detail": "User opened the link 3 minutes after the email arrived.",
    },
    {
        "at": "2026-10-30T09:43:40Z",
        "source": "web-proxy",
        "user": "j.rao@company.example",
        "event": "HTTP POST",
        "url": "https://passwrd-reset-secure.example/login",
        "detail": "Form submission to the reset page (possible credential entry).",
    },
    {
        "at": "2026-10-30T09:51:02Z",
        "source": "identity-provider",
        "user": "j.rao@company.example",
        "event": "Sign-in from new location",
        "url": None,
        "detail": "Successful sign-in from 203.0.113.45, never seen for this user.",
    },
    {
        "at": "2026-10-30T10:20:37Z",
        "source": "web-proxy",
        "user": "finance@company.example",
        "event": "HTTP GET",
        "url": "https://remittance-update.example/portal",
        "detail": "Finance mailbox opened the new remittance portal.",
    },
    {
        "at": "2026-10-30T08:05:19Z",
        "source": "web-proxy",
        "user": "finance@company.example",
        "event": "HTTP GET",
        "url": "https://statements.example/portal",
        "detail": "Routine visit to the usual statement portal.",
    },
)
