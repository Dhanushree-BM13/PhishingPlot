from __future__ import annotations

import re
import time
from datetime import datetime
from typing import Any, Callable
from urllib.parse import urlparse

from .agents import URGENCY_PATTERN, analyze_incident, email_record_from_raw
from .demo_history import demo_sender_history
from .synthetic_logs import SYNTHETIC_LOGS

LOOKALIKE_TOKENS = ("reset", "secure", "login", "verify", "update", "account", "support")
CREDENTIAL_PATTERN = re.compile(r"\b(?:password|passcode|sign\s*in|log\s*in|reset|verify)\b", re.I)
PAYMENT_PATTERN = re.compile(r"\b(?:payment|invoice|bank|remittance|wire)\b", re.I)
RISK_ORDER = ("low", "medium", "high", "critical")

Case = dict[str, Any]
AgentResult = dict[str, Any]


def _host(url: str) -> str | None:
    try:
        host = urlparse(url.rstrip(".,);")).hostname
    except ValueError:
        return None
    return host.lower() if host else None


def triage_agent(case: Case) -> AgentResult:
    record = case["record"]
    sender_domain = record.sender_address.rsplit("@", 1)[-1].lower()
    link_domains = sorted({host for url in record.urls if (host := _host(url))})
    text = f"{record.subject}\n{record.body}"
    indicators: list[str] = []
    if URGENCY_PATTERN.search(text) or re.search(r"\b(?:today|expires?|lockout)\b", text, re.I):
        indicators.append("Urgency or deadline pressure")
    if CREDENTIAL_PATTERN.search(text):
        indicators.append("Credential or password request")
    if PAYMENT_PATTERN.search(text):
        indicators.append("Payment or bank-detail language")
    if record.attachment_types:
        indicators.append(f"Attachment types: {', '.join(record.attachment_types)}")
    case.update(sender_domain=sender_domain, link_domains=link_domains, indicators=indicators)
    return {
        "task": "Extract sender, links and key indicators from the reported email",
        "evidence": [
            f"Sender: {record.sender_address} (domain {sender_domain})",
            f"Links: {', '.join(link_domains) if link_domains else 'none'}",
            *[f"Indicator: {indicator}" for indicator in indicators],
        ],
        "reasoning": (
            f"Parsed the message and found {len(record.urls)} link(s) and "
            f"{len(indicators)} content indicator(s) to hand to the investigator."
        ),
        "confidence": 0.95,
    }


def investigator_agent(case: Case) -> AgentResult:
    sender_domain: str = case["sender_domain"]
    evidence: list[str] = []
    suspicious_domains: list[str] = []
    for domain in case["link_domains"]:
        reasons = []
        if domain != sender_domain and not domain.endswith(f".{sender_domain}"):
            reasons.append("differs from sender domain")
        tokens = [token for token in LOOKALIKE_TOKENS if token in domain]
        if tokens:
            reasons.append(f"lookalike wording ({', '.join(tokens)})")
        if re.search(r"(.)\1|passwrd|paypa1|micros0ft", domain):
            reasons.append("misspelled or repeated characters")
        if reasons:
            suspicious_domains.append(domain)
            evidence.append(f"{domain}: {'; '.join(reasons)}")
        else:
            evidence.append(f"{domain}: no domain-level red flags")

    log_hits = [
        event
        for event in SYNTHETIC_LOGS
        if event["url"] and _host(event["url"]) in set(case["link_domains"])
    ]
    clicked_users = sorted({event["user"] for event in log_hits})
    follow_ups = [
        event
        for event in SYNTHETIC_LOGS
        if event["url"] is None and event["user"] in clicked_users
    ]
    for event in [*log_hits, *follow_ups]:
        evidence.append(f"Log {event['source']} {event['at']}: {event['user']} {event['event']}. {event['detail']}")
    if not log_hits:
        evidence.append("No matching events in the synthetic proxy or sign-in logs.")
    case.update(
        suspicious_domains=suspicious_domains,
        log_hits=log_hits,
        follow_ups=follow_ups,
        clicked_users=clicked_users,
    )
    return {
        "task": "Check link domains offline and search synthetic proxy and sign-in logs",
        "evidence": evidence,
        "reasoning": (
            f"{len(suspicious_domains)} of {len(case['link_domains'])} link domain(s) look suspicious; "
            f"{len(log_hits)} matching log event(s) involving {len(clicked_users)} user(s)."
            " Links are never opened; only their text and local logs are inspected."
        ),
        "confidence": 0.85 if case["link_domains"] else 0.6,
    }


def risk_reviewer_agent(case: Case) -> AgentResult:
    base = analyze_incident(
        case["subject"],
        case["sender"],
        case["raw_email"],
        now=case["now"],
        sender_history=demo_sender_history(case["sender"], now=case["now"]),
    )
    risk: str = base["risk"]
    score: int = base["riskScore"]
    reasons: list[str] = [f"Content and sender-behavior heuristics: {risk.upper()} ({score}/100)."]
    if case["suspicious_domains"]:
        score = max(score, 60)
        if RISK_ORDER.index(risk) < RISK_ORDER.index("medium"):
            risk = "medium"
        reasons.append(f"Investigator flagged {', '.join(case['suspicious_domains'])}.")
    if case["suspicious_domains"] and "Credential or password request" in case["indicators"]:
        risk, score = max(risk, "high", key=RISK_ORDER.index), max(score, 80)
        reasons.append("A credential request points to a suspicious domain.")
    if case["clicked_users"]:
        risk, score = "critical", min(100, max(score, 90) + 5 * len(case["clicked_users"]))
        reasons.append(f"Logs show {', '.join(case['clicked_users'])} already visited the link.")
    if case["follow_ups"]:
        reasons.append("A sign-in from a new location followed the click: possible account takeover.")
    behavior = base["senderBehavior"]
    if behavior["trustDiscountRemoved"]:
        reasons.append("Known sender broke its own baseline; trust discount removed.")
    agreeing = sum(bool(x) for x in (case["indicators"], case["suspicious_domains"], case["log_hits"]))
    case.update(risk=risk, score=score, base=base, reasons=reasons)
    return {
        "task": "Cross-check the evidence from both agents and score the risk",
        "evidence": reasons,
        "reasoning": f"Final risk {risk.upper()} ({score}/100) from {agreeing} of 3 independent evidence sources.",
        "confidence": round(0.55 + 0.15 * agreeing, 2),
    }


def response_agent(case: Case) -> AgentResult:
    actions: list[dict[str, str]] = []

    def propose(action_id: str, title: str, target: str, impact: str) -> None:
        actions.append(
            {"id": action_id, "title": title, "target": target, "impact": impact, "status": "pending_approval"}
        )

    if case["risk"] in {"medium", "high", "critical"}:
        propose("quarantine", "Quarantine the reported message", case["sender"], "Removes the email from all inboxes.")
    for domain in case["suspicious_domains"]:
        propose(f"block-{domain}", "Block domain at the web proxy", domain, "Users can no longer open this link.")
    for user in case["clicked_users"]:
        propose(f"reset-{user}", "Force password reset and revoke sessions", user, "User must sign in again.")
    if case["base"]["senderBehavior"]["trustDiscountRemoved"]:
        propose("verify-sender", "Verify the request with the sender by phone", case["sender"], "Out-of-band check before any payment.")
    if not actions:
        propose("close", "Close as legitimate", case["sender"], "No containment needed.")
    case["actions"] = actions
    return {
        "task": "Draft safe containment steps for analyst approval",
        "evidence": [f"{action['title']} → {action['target']}" for action in actions],
        "reasoning": "Every action waits for analyst approval; nothing is executed automatically.",
        "confidence": 0.9,
    }


PLAN: tuple[tuple[str, str, Callable[[Case], AgentResult]], ...] = (
    ("triage", "Triage Agent", triage_agent),
    ("investigator", "Investigation Agent", investigator_agent),
    ("risk_reviewer", "Risk Reviewer Agent", risk_reviewer_agent),
    ("response", "Response Agent", response_agent),
)


def run_investigation(subject: str, sender: str, body: str, urls: list[str], *, now: datetime) -> dict[str, Any]:
    """Run the agents in order over one shared case record; a failing agent is recorded, not fatal."""
    raw_email = "\n".join([body, *urls])
    case: Case = {
        "subject": subject,
        "sender": sender,
        "raw_email": raw_email,
        "now": now,
        "record": email_record_from_raw(sender, subject, raw_email, sent_at=now),
    }
    agents: list[dict[str, Any]] = []
    for agent_id, name, run in PLAN:
        started = time.perf_counter()
        try:
            result = {**run(case), "status": "completed"}
        except Exception as exc:  # noqa: BLE001 - surface the failure on the agent card
            result = {
                "task": "Agent failed",
                "evidence": [],
                "reasoning": f"{type(exc).__name__}: {exc}",
                "confidence": 0.0,
                "status": "failed",
            }
        agents.append(
            {"id": agent_id, "name": name, "durationMs": round((time.perf_counter() - started) * 1000, 1), **result}
        )

    risk = case.get("risk", "medium")
    score = case.get("score", 50)
    return {
        "risk": risk,
        "riskScore": score,
        "agents": agents,
        "recommendedActions": case.get("actions", []),
        "logMatches": [*case.get("log_hits", []), *case.get("follow_ups", [])],
        "indicators": [*case.get("indicators", []), *[f"Suspicious domain: {d}" for d in case.get("suspicious_domains", [])]],
        "evidence": [item for agent in agents for item in agent["evidence"]],
        "explanation": " ".join(case.get("reasons", ["Risk review did not complete; analyst review required."])),
        "senderBehavior": case.get("base", {}).get("senderBehavior"),
    }
