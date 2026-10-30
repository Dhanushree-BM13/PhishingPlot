from __future__ import annotations

import os
import time
from typing import Any

import httpx

TIMEOUT = 10


class StoreError(RuntimeError):
    """Supabase rejected or could not complete a request."""


# First non-empty name wins. The fallbacks are what Vercel's Supabase integration sets.
URL_NAMES = ("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")
KEY_NAMES = ("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY")


def _first_env(names: tuple[str, ...]) -> str:
    for name in names:
        value = os.environ.get(name, "").strip().strip('"').strip("'")
        if value:
            return value
    return ""


def _config() -> tuple[str, str] | None:
    url = _first_env(URL_NAMES).rstrip("/")
    key = _first_env(KEY_NAMES)
    return (url, key) if url and key else None


def is_configured() -> bool:
    return _config() is not None


def missing_settings() -> list[str]:
    """Names (never values) of required settings that are not set, for the health endpoint."""
    missing = []
    if not _first_env(URL_NAMES):
        missing.append(URL_NAMES[0])
    if not _first_env(KEY_NAMES):
        missing.append(KEY_NAMES[0])
    return missing


async def _request(
    method: str,
    table: str,
    *,
    params: dict[str, str] | None = None,
    payload: Any = None,
    prefer: str = "return=representation",
) -> Any:
    config = _config()
    if config is None:
        raise StoreError("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.")
    url, key = config
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.request(
                method,
                f"{url}/rest/v1/{table}",
                headers={"apikey": key, "Content-Type": "application/json", "Prefer": prefer},
                params=params,
                json=payload,
            )
    except httpx.RequestError as exc:
        raise StoreError("Could not reach Supabase.") from exc
    if response.is_error:
        try:
            message = response.json().get("message", response.text)
        except ValueError:
            message = response.text
        raise StoreError(f"Supabase {response.status_code}: {message}")
    return response.json() if response.content else []


_ping_cache: tuple[float, str] | None = None
PING_TTL_SECONDS = 20


async def ping() -> str:
    """Return 'connected', 'not_configured' or 'error'; cached briefly so health checks stay fast."""
    global _ping_cache
    if not is_configured():
        return "not_configured"
    now = time.monotonic()
    if _ping_cache and now - _ping_cache[0] < PING_TTL_SECONDS:
        return _ping_cache[1]
    try:
        await _request("GET", "investigations", params={"select": "id", "limit": "1"})
    except StoreError:
        state = "error"
    else:
        state = "connected"
    _ping_cache = (now, state)
    return state


async def save_investigation(request: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    """Persist one orchestrator run; returns the stored investigation id and action ids."""
    [row] = await _request(
        "POST",
        "investigations",
        payload={
            "subject": request["subject"],
            "sender": request["sender"],
            "body": request["body"],
            "urls": request["urls"],
            "risk": result["risk"],
            "risk_score": result["riskScore"],
            "explanation": result["explanation"],
            "indicators": result["indicators"],
        },
    )
    investigation_id = row["id"]
    await _request(
        "POST",
        "investigation_agent_runs",
        payload=[
            {
                "investigation_id": investigation_id,
                "position": index,
                "agent_id": agent["id"],
                "name": agent["name"],
                "status": agent["status"],
                "task": agent["task"],
                "evidence": agent["evidence"],
                "reasoning": agent["reasoning"],
                "confidence": agent["confidence"],
                "duration_ms": agent["durationMs"],
            }
            for index, agent in enumerate(result["agents"])
        ],
        prefer="return=minimal",
    )
    actions = await _request(
        "POST",
        "investigation_actions",
        payload=[
            {
                "investigation_id": investigation_id,
                "action_key": action["id"],
                "title": action["title"],
                "target": action["target"],
                "impact": action["impact"],
            }
            for action in result["recommendedActions"]
        ],
    )
    await add_audit(
        investigation_id,
        "Investigation completed",
        f"{len(result['agents'])} agents ran; final risk {result['risk'].upper()} ({result['riskScore']}).",
    )
    return {
        "id": investigation_id,
        "createdAt": row["created_at"],
        "actionIds": {action["action_key"]: action["id"] for action in actions},
    }


async def add_audit(investigation_id: str, event: str, detail: str) -> None:
    await _request(
        "POST",
        "investigation_audit",
        payload={"investigation_id": investigation_id, "event": event, "detail": detail},
        prefer="return=minimal",
    )


async def list_investigations(limit: int = 20) -> list[dict[str, Any]]:
    rows = await _request(
        "GET",
        "investigations",
        params={
            "select": "id,created_at,subject,sender,risk,risk_score,status",
            "order": "created_at.desc",
            "limit": str(limit),
        },
    )
    return [
        {
            "id": row["id"],
            "createdAt": row["created_at"],
            "subject": row["subject"],
            "sender": row["sender"],
            "risk": row["risk"],
            "riskScore": row["risk_score"],
            "status": row["status"],
        }
        for row in rows
    ]


async def decide_action(investigation_id: str, action_id: str, decision: str, decided_at: str) -> dict[str, Any]:
    rows = await _request(
        "PATCH",
        "investigation_actions",
        params={
            "id": f"eq.{action_id}",
            "investigation_id": f"eq.{investigation_id}",
            "status": "eq.pending_approval",
        },
        payload={"status": decision, "decided_at": decided_at},
    )
    if not rows:
        raise LookupError("Pending action not found.")
    action = rows[0]
    await add_audit(
        investigation_id,
        f"Action {decision}",
        f"{action['title']} → {action['target']}. Simulated; no external action executed.",
    )
    return {"id": action["id"], "status": action["status"], "decidedAt": action["decided_at"]}


async def list_audit(investigation_id: str) -> list[dict[str, Any]]:
    rows = await _request(
        "GET",
        "investigation_audit",
        params={
            "select": "created_at,event,detail",
            "investigation_id": f"eq.{investigation_id}",
            "order": "created_at.asc",
        },
    )
    return [{"at": row["created_at"], "event": row["event"], "detail": row["detail"]} for row in rows]
