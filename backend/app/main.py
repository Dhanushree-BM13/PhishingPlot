from __future__ import annotations

import os
from datetime import UTC, datetime
from typing import Any, Literal
from uuid import UUID

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .agents import AGENT_NAMES, analyze_incident, email_record_from_raw
from .clock import as_utc, utc_now
from .orchestrator import run_investigation
from .supabase_rest import SupabaseRest

app = FastAPI(title="PHISHPILOT Incident API", version="1.0.0")
origins = [
    origin.strip()
    for origin in os.environ.get(
        "FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:8080"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


class User(BaseModel):
    id: UUID
    email: EmailStr | None = None


class IncidentSubmission(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    subject: str = Field(min_length=1, max_length=500)
    sender: EmailStr
    reporter: EmailStr
    raw_email: str = Field(alias="rawEmail", min_length=1, max_length=100_000)


class ApprovalDecision(BaseModel):
    decision: Literal["approved", "rejected"]


class AnalyzeRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=500)
    sender: str = Field(min_length=3, max_length=320)
    body: str = Field(min_length=1, max_length=100_000)
    urls: list[str] = Field(default_factory=list, max_length=50)


async def authenticated(
    authorization: str | None = Header(default=None),
) -> tuple[User, SupabaseRest]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    token = authorization.removeprefix("Bearer ").strip()
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    anon_key = os.environ.get("SUPABASE_ANON_KEY", "")
    if not url or not anon_key:
        raise HTTPException(status_code=503, detail="Supabase authentication is not configured.")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{url}/auth/v1/user",
                headers={"apikey": anon_key, "Authorization": f"Bearer {token}"},
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="Could not verify the Supabase session.") from exc
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Supabase session is invalid or expired.")
    data = response.json()
    user = User(id=data["id"], email=data.get("email"))
    return user, SupabaseRest(token)


def _incident(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "subject": row["subject"],
        "sender": row["sender"],
        "reporter": row["reporter"],
        "receivedAt": row["received_at"],
        "status": row["status"],
        "risk": row.get("risk"),
        "riskScore": row.get("risk_score"),
        "evidence": row.get("evidence", []),
        "recommendation": row.get("recommendation"),
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/health")
async def api_health() -> dict[str, str]:
    return {"status": "ok", "version": app.version}


@app.post("/api/analyze")
async def api_analyze(
    request: AnalyzeRequest,
    now: datetime = Depends(utc_now),
) -> dict[str, Any]:
    """Stateless multi-agent investigation; nothing is stored, fetched or executed."""
    return run_investigation(
        request.subject, request.sender, request.body, request.urls, now=now
    )


@app.get("/incidents")
async def list_incidents(context: tuple[User, SupabaseRest] = Depends(authenticated)) -> list[dict[str, Any]]:
    _, db = context
    rows = await db.request(
        "GET",
        "incidents",
        params={"select": "*", "order": "received_at.desc"},
    )
    return [_incident(row) for row in rows]


@app.post("/incidents", status_code=201)
async def submit_incident(
    incident: IncidentSubmission,
    context: tuple[User, SupabaseRest] = Depends(authenticated),
    now: datetime = Depends(utc_now),
) -> dict[str, Any]:
    user, db = context
    sender = str(incident.sender)
    history_rows = await db.request(
        "GET",
        "incidents",
        params={
            "select": "sender,subject,raw_email,received_at",
            "sender": f"ilike.{sender}",
            "order": "received_at.asc",
            "limit": "1000",
        },
    )
    sender_history = [
        email_record_from_raw(
            row["sender"],
            row["subject"],
            row["raw_email"],
            sent_at=as_utc(datetime.fromisoformat(row["received_at"].replace("Z", "+00:00"))),
        )
        for row in history_rows
    ]
    analysis = analyze_incident(
        incident.subject,
        sender,
        incident.raw_email,
        now=now,
        sender_history=sender_history,
    )
    received_at = as_utc(now).isoformat()
    inserted = await db.request(
        "POST",
        "incidents",
        payload={
            "owner_id": str(user.id),
            "subject": incident.subject,
            "sender": str(incident.sender),
            "reporter": str(incident.reporter),
            "raw_email": incident.raw_email,
            "received_at": received_at,
            "status": "awaiting_approval",
            "risk": analysis["risk"],
            "risk_score": analysis["riskScore"],
            "evidence": analysis["evidence"],
            "recommendation": analysis["recommendation"],
        },
    )
    row = inserted[0]
    incident_id = row["id"]
    for agent_name in AGENT_NAMES:
        await db.request(
            "POST",
            "agent_runs",
            payload={
                "owner_id": str(user.id),
                "incident_id": incident_id,
                "agent_name": agent_name,
                "status": "completed",
                "result": analysis,
                "completed_at": received_at,
            },
            prefer="return=minimal",
        )
    await db.request(
        "POST",
        "approvals",
        payload={
            "owner_id": str(user.id),
            "incident_id": incident_id,
            "action": analysis["recommendation"],
            "status": "pending",
        },
        prefer="return=minimal",
    )
    await db.request(
        "POST",
        "audit_logs",
        payload={
            "owner_id": str(user.id),
            "actor": str(user.email or user.id),
            "event": "Incident submitted and analyzed",
            "target": incident_id,
        },
        prefer="return=minimal",
    )
    return _incident(row)


@app.get("/agents")
async def list_agents(context: tuple[User, SupabaseRest] = Depends(authenticated)) -> list[dict[str, Any]]:
    _, db = context
    rows = await db.request(
        "GET",
        "agent_runs",
        params={
            "select": "agent_name,status,completed_at",
            "order": "completed_at.desc",
            "limit": "100",
        },
    )
    latest: dict[str, dict[str, Any]] = {}
    for row in rows:
        latest.setdefault(
            row["agent_name"],
            {
                "id": row["agent_name"].lower().replace(" ", "-"),
                "name": row["agent_name"],
                "role": "Offline heuristic analysis; no external actions are executed.",
                "status": row["status"],
                "lastRun": row.get("completed_at"),
            },
        )
    return list(latest.values())


@app.get("/approvals")
async def list_approvals(
    context: tuple[User, SupabaseRest] = Depends(authenticated),
) -> list[dict[str, Any]]:
    _, db = context
    rows = await db.request(
        "GET",
        "approvals",
        params={"select": "*", "order": "created_at.desc"},
    )
    return [
        {
            "id": row["id"],
            "incidentId": row["incident_id"],
            "action": row["action"],
            "requestedBy": "PHISHPILOT analysis",
            "requestedAt": row["created_at"],
            "status": row["status"],
        }
        for row in rows
    ]


@app.post("/approvals/{approval_id}/decision")
async def decide_approval(
    approval_id: UUID,
    decision: ApprovalDecision,
    context: tuple[User, SupabaseRest] = Depends(authenticated),
    now: datetime = Depends(utc_now),
) -> dict[str, str]:
    user, db = context
    rows = await db.request(
        "PATCH",
        "approvals",
        params={"id": f"eq.{approval_id}", "status": "eq.pending"},
        payload={
            "status": decision.decision,
            "decided_by": str(user.id),
            "decided_at": as_utc(now).isoformat(),
        },
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Pending approval not found.")
    await db.request(
        "POST",
        "audit_logs",
        payload={
            "owner_id": str(user.id),
            "actor": str(user.email or user.id),
            "event": f"Approval {decision.decision}; no external action was executed",
            "target": str(approval_id),
        },
        prefer="return=minimal",
    )
    return {"status": decision.decision, "executed": "false"}


@app.get("/audit-logs")
async def list_audit_logs(context: tuple[User, SupabaseRest] = Depends(authenticated)) -> list[dict[str, Any]]:
    _, db = context
    rows = await db.request(
        "GET",
        "audit_logs",
        params={"select": "*", "order": "created_at.desc", "limit": "200"},
    )
    return [
        {
            "id": row["id"],
            "at": row["created_at"],
            "actor": row["actor"],
            "event": row["event"],
            "target": row["target"],
        }
        for row in rows
    ]
