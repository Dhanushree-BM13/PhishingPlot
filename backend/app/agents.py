from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from email import policy
from email.parser import Parser
from email.utils import parsedate_to_datetime
import math
import re
from statistics import median
from typing import Any, Literal, Sequence
from urllib.parse import urlparse

from .analysis_config import ANALYSIS_CONFIG


AGENT_NAMES = (
    "Triage Agent",
    "Investigation Agent",
    "Risk Reviewer Agent",
    "Response Agent",
)

URGENCY_TERMS = ("urgent", "immediately", "within 24 hours", "suspended", "verify")
CREDENTIAL_TERMS = ("password", "payroll", "bank", "sign in", "login", "account")
URL_PATTERN = re.compile(r"https?://[^\s<>\"']+", re.IGNORECASE)
WORD_PATTERN = re.compile(r"\b[\w']+\b", re.UNICODE)
PAYMENT_PATTERN = re.compile(
    r"\b(?:payment|invoice|pay|wire transfer|bank transfer|send funds|payment details)\b",
    re.IGNORECASE,
)
CREDENTIAL_REQUEST_PATTERN = re.compile(
    r"\b(?:log\s*in|sign\s*in|login|verify|reset)\b",
    re.IGNORECASE,
)
BANK_CHANGE_PATTERN = re.compile(
    r"\b(?:change|update|updated|new|different|revised)\b[\w\s-]{0,40}"
    r"\b(?:bank|account|iban|routing)\b"
    r"|\b(?:bank|account|iban|routing)\b[\w\s-]{0,40}"
    r"\b(?:change|changed|update|updated|new|different|revised)\b",
    re.IGNORECASE,
)
URGENCY_PATTERN = re.compile(
    r"\burgent\b|\bimmediately\b|\bwithin 24 hours\b|\bsuspended\b|\bverify\b",
    re.IGNORECASE,
)
SENDER_LEVELS = ("low", "medium", "high", "critical")


@dataclass(frozen=True)
class EmailRecord:
    sender_address: str
    subject: str
    body: str
    sent_at: datetime
    urls: tuple[str, ...] = ()
    attachment_types: tuple[str, ...] = ()
    reply_to: str | None = None
    infra_fingerprint: str | None = None
    thread_id: str | None = None
    authenticated: bool = False


@dataclass(frozen=True)
class SenderBaseline:
    sender_address: str
    sample_size: int
    known_link_domains: tuple[str, ...]
    known_attachment_types: tuple[str, ...]
    known_reply_to: tuple[str, ...]
    known_infra_fingerprints: tuple[str, ...]
    send_hour_range: tuple[int, int]
    has_requested_payment: bool
    has_requested_credentials: bool
    has_requested_bank_detail_changes: bool
    median_length: float
    urgency_rate: float


@dataclass(frozen=True)
class AnalyzerSignal:
    id: str
    weight: int
    detail: str


@dataclass(frozen=True)
class AnalyzerVerdict:
    analyzer_id: str
    level: Literal["low", "medium", "high", "critical"]
    score: int
    confidence: float
    signals: tuple[AnalyzerSignal, ...]
    rationale: str
    ruleset_version: str


@dataclass(frozen=True)
class SenderBehaviorAnalysis:
    baseline: SenderBaseline
    deviation_score: int
    trust_discount_applied: bool
    trust_discount_removed: bool
    verdict: AnalyzerVerdict


def _normalized(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.split()).strip().lower()
    return normalized or None


def _domain(url: str) -> str | None:
    try:
        hostname = urlparse(url.rstrip(".,);")).hostname
    except ValueError:
        return None
    return hostname.lower() if hostname else None


def _message_text(record: EmailRecord) -> str:
    return f"{record.subject}\n{record.body}".strip()


def _term_rate(text: str, pattern: re.Pattern[str]) -> float:
    words = WORD_PATTERN.findall(text)
    if not words:
        return 0.0
    return len(pattern.findall(text)) / len(words)


def _is_payment_request(text: str) -> bool:
    return bool(PAYMENT_PATTERN.search(text) or BANK_CHANGE_PATTERN.search(text))


def _is_credential_request(text: str) -> bool:
    return bool(CREDENTIAL_REQUEST_PATTERN.search(text))


def _hour_in_utc(value: datetime, *, now: datetime | None = None) -> int:
    timezone = now.tzinfo if now is not None and now.tzinfo is not None else UTC
    aware = value.replace(tzinfo=timezone) if value.tzinfo is None else value.astimezone(UTC)
    return aware.hour


def _percentile(values: Sequence[int], quantile: float) -> float:
    ordered = sorted(values)
    position = (len(ordered) - 1) * quantile
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return float(ordered[lower])
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def build_sender_baseline(
    history: Sequence[EmailRecord],
    *,
    sender_address: str | None = None,
    thread_id: str | None = None,
) -> SenderBaseline:
    """Build a deterministic profile from prior messages for one sender."""
    requested_sender = _normalized(sender_address)
    if requested_sender is None and history:
        requested_sender = _normalized(history[0].sender_address)
    sender_history = [
        record
        for record in history
        if requested_sender is None
        or _normalized(record.sender_address) == requested_sender
    ]
    normalized_thread = _normalized(thread_id)
    if normalized_thread is not None:
        same_thread = [
            record
            for record in sender_history
            if _normalized(record.thread_id) == normalized_thread
        ]
        if same_thread:
            sender_history = same_thread

    domains = {
        domain
        for record in sender_history
        for url in record.urls
        if (domain := _domain(url)) is not None
    }
    attachment_types = {
        content_type.lower().strip()
        for record in sender_history
        for content_type in record.attachment_types
        if content_type.strip()
    }
    reply_to = {
        address
        for record in sender_history
        if (address := _normalized(record.reply_to)) is not None
    }
    infra_fingerprints = {
        fingerprint
        for record in sender_history
        if (fingerprint := _normalized(record.infra_fingerprint)) is not None
    }
    hours = [_hour_in_utc(record.sent_at) for record in sender_history]
    lengths = [len(_message_text(record)) for record in sender_history]
    urgency_rates = [
        _term_rate(_message_text(record), URGENCY_PATTERN)
        for record in sender_history
    ]

    return SenderBaseline(
        sender_address=requested_sender or "",
        sample_size=len(sender_history),
        known_link_domains=tuple(sorted(domains)),
        known_attachment_types=tuple(sorted(attachment_types)),
        known_reply_to=tuple(sorted(reply_to)),
        known_infra_fingerprints=tuple(sorted(infra_fingerprints)),
        send_hour_range=(
            math.floor(_percentile(hours, 0.05)),
            math.ceil(_percentile(hours, 0.95)),
        )
        if hours
        else (0, 23),
        has_requested_payment=any(
            _is_payment_request(_message_text(record)) for record in sender_history
        ),
        has_requested_credentials=any(
            _is_credential_request(_message_text(record))
            for record in sender_history
        ),
        has_requested_bank_detail_changes=any(
            bool(BANK_CHANGE_PATTERN.search(_message_text(record)))
            for record in sender_history
        ),
        median_length=float(median(lengths)) if lengths else 0.0,
        urgency_rate=float(median(urgency_rates)) if urgency_rates else 0.0,
    )


def analyze_sender_behavior(
    current: EmailRecord,
    baseline: SenderBaseline,
    *,
    now: datetime,
) -> SenderBehaviorAnalysis:
    """Compare one message with its sender baseline without external I/O."""
    config = ANALYSIS_CONFIG
    weights = config["signal_weights"]
    text = _message_text(current)
    current_domains = {
        domain
        for url in current.urls
        if (domain := _domain(url)) is not None
    }
    known_domains = set(baseline.known_link_domains)
    current_reply_to = _normalized(current.reply_to)
    current_infra = _normalized(current.infra_fingerprint)
    current_attachments = {
        content_type.lower().strip()
        for content_type in current.attachment_types
        if content_type.strip()
    }
    signals: list[AnalyzerSignal] = []

    new_domains = sorted(current_domains - known_domains)
    if new_domains:
        signals.append(
            AnalyzerSignal(
                "NEW_LINK_DOMAIN",
                weights["NEW_LINK_DOMAIN"],
                f"Link domain(s) not seen in this sender's history: {', '.join(new_domains)}.",
            )
        )
    if (
        current_reply_to is not None
        and baseline.known_reply_to
        and current_reply_to not in baseline.known_reply_to
    ):
        signals.append(
            AnalyzerSignal(
                "REPLY_TO_CHANGED",
                weights["REPLY_TO_CHANGED"],
                "The Reply-To address differs from all addresses in this sender's history.",
            )
        )
    if (
        current_infra is not None
        and baseline.known_infra_fingerprints
        and current_infra not in baseline.known_infra_fingerprints
    ):
        signals.append(
            AnalyzerSignal(
                "INFRA_CHANGED",
                weights["INFRA_CHANGED"],
                "The sending infrastructure fingerprint is new for this sender.",
            )
        )

    payment_request = _is_payment_request(text)
    credential_request = _is_credential_request(text)
    bank_change = bool(BANK_CHANGE_PATTERN.search(text))
    if payment_request and not baseline.has_requested_payment:
        signals.append(
            AnalyzerSignal(
                "FIRST_PAYMENT_REQUEST",
                weights["FIRST_PAYMENT_REQUEST"],
                "This sender has not previously requested payment or invoice changes.",
            )
        )
    if bank_change:
        signals.append(
            AnalyzerSignal(
                "BANK_DETAIL_CHANGE",
                weights["BANK_DETAIL_CHANGE"],
                "The message asks to change or update bank or account details.",
            )
        )
    if credential_request and not baseline.has_requested_credentials:
        signals.append(
            AnalyzerSignal(
                "FIRST_CREDENTIAL_REQUEST",
                weights["FIRST_CREDENTIAL_REQUEST"],
                "This sender has not previously asked the recipient to sign in, verify, or reset credentials.",
            )
        )

    if baseline.sample_size:
        current_hour = _hour_in_utc(current.sent_at, now=now)
        if not baseline.send_hour_range[0] <= current_hour <= baseline.send_hour_range[1]:
            signals.append(
                AnalyzerSignal(
                    "UNUSUAL_SEND_TIME",
                    weights["UNUSUAL_SEND_TIME"],
                    f"Message arrived at UTC hour {current_hour}, outside the sender's typical "
                    f"{baseline.send_hour_range[0]}-{baseline.send_hour_range[1]} UTC range.",
                )
            )
        current_urgency_rate = _term_rate(text, URGENCY_PATTERN)
        if (
            current_urgency_rate
            > baseline.urgency_rate + config["urgency_spike_rate_delta"]
        ):
            signals.append(
                AnalyzerSignal(
                    "URGENCY_SPIKE",
                    weights["URGENCY_SPIKE"],
                    "Urgency language is substantially above this sender's baseline.",
                )
            )

    new_attachments = sorted(
        current_attachments - set(baseline.known_attachment_types)
    )
    if new_attachments:
        signals.append(
            AnalyzerSignal(
                "NEW_ATTACHMENT_TYPE",
                weights["NEW_ATTACHMENT_TYPE"],
                f"Attachment type(s) not seen in this sender's history: "
                f"{', '.join(new_attachments)}.",
            )
        )
    if baseline.sample_size < config["minimum_baseline_sample_size"]:
        signals.append(
            AnalyzerSignal(
                "LOW_SAMPLE",
                weights["LOW_SAMPLE"],
                f"Only {baseline.sample_size} prior message(s) are available; at least "
                f"{config['minimum_baseline_sample_size']} are needed for a reliable baseline.",
            )
        )

    deviation_score = min(100, sum(signal.weight for signal in signals))
    trust_break = deviation_score >= config["trust_break_threshold"]
    has_payment_or_credential_signal = any(
        signal.id
        in {"FIRST_PAYMENT_REQUEST", "FIRST_CREDENTIAL_REQUEST", "BANK_DETAIL_CHANGE"}
        for signal in signals
    )
    trust_discount_eligible = (
        baseline.sample_size >= config["minimum_baseline_sample_size"]
    )
    trust_discount_applied = trust_discount_eligible and not trust_break
    trust_discount_removed = trust_discount_eligible and trust_break

    if has_payment_or_credential_signal:
        level = "high"
    elif deviation_score >= config["risk_floor_thresholds"]["high"]:
        level = "high"
    elif deviation_score >= config["risk_floor_thresholds"]["medium"]:
        level = "medium"
    else:
        level = "low"

    confidence = min(
        1.0, baseline.sample_size / config["minimum_baseline_sample_size"]
    )
    deviation_signals = [signal for signal in signals if signal.id != "LOW_SAMPLE"]
    if deviation_signals:
        deviations = "; ".join(signal.detail.rstrip(".") for signal in deviation_signals)
        sender_context = (
            f"Sender is authenticated and has {baseline.sample_size} prior messages"
            if current.authenticated
            else f"Sender has {baseline.sample_size} prior messages"
        )
        rationale = f"{sender_context}, but this message deviates from its history: {deviations}."
    else:
        rationale = (
            f"Sender behavior is consistent with the {baseline.sample_size} prior message(s) "
            "available for comparison."
        )
    if baseline.sample_size < config["minimum_baseline_sample_size"]:
        rationale += " Confidence is reduced because the sender baseline has a low sample size."
    if trust_discount_removed:
        rationale += " The sender trust discount is removed because behavior crossed the trust-break threshold."
    elif trust_discount_applied:
        rationale += " Behavior is consistent enough for the existing sender trust discount."

    verdict = AnalyzerVerdict(
        analyzer_id="sender_behavior",
        level=level,
        score=deviation_score,
        confidence=confidence,
        signals=tuple(signals),
        rationale=rationale,
        ruleset_version=config["ruleset_version"],
    )
    return SenderBehaviorAnalysis(
        baseline=baseline,
        deviation_score=deviation_score,
        trust_discount_applied=trust_discount_applied,
        trust_discount_removed=trust_discount_removed,
        verdict=verdict,
    )


def email_record_from_raw(
    sender: str,
    subject: str,
    raw_email: str,
    *,
    sent_at: datetime,
) -> EmailRecord:
    """Extract deterministic message metadata from an RFC-style email string."""
    message = Parser(policy=policy.default).parsestr(raw_email)
    body_parts: list[str] = []
    attachment_types: set[str] = set()
    if message.is_multipart():
        for part in message.walk():
            if part.is_multipart():
                continue
            if part.get_filename() or part.get_content_disposition() == "attachment":
                attachment_types.add(part.get_content_type().lower())
            elif part.get_content_maintype() == "text":
                content = part.get_content()
                if isinstance(content, str):
                    body_parts.append(content)
    else:
        content = message.get_content()
        if isinstance(content, str):
            body_parts.append(content)
        if message.get_filename() or message.get_content_disposition() == "attachment":
            attachment_types.add(message.get_content_type().lower())
    body = "\n".join(body_parts)
    urls = tuple(
        dict.fromkeys(
            match.rstrip(".,);")
            for match in URL_PATTERN.findall(f"{subject}\n{body}")
        )
    )

    parsed_sent_at = sent_at
    date_header = message.get("Date")
    if date_header:
        try:
            header_time = parsedate_to_datetime(str(date_header))
        except (TypeError, ValueError, OverflowError):
            header_time = None
        if header_time is not None:
            parsed_sent_at = (
                header_time.replace(tzinfo=UTC)
                if header_time.tzinfo is None
                else header_time.astimezone(UTC)
            )

    reply_to = _normalized(str(message.get("Reply-To", "")))
    infra_fingerprint = _infra_fingerprint(message)
    references = message.get("References") or message.get("In-Reply-To")
    thread_id = _normalized(str(references)) if references else None
    authentication_results = " ".join(
        str(value) for value in message.get_all("Authentication-Results", [])
    )
    authenticated = all(
        re.search(rf"\b{mechanism}\s*=\s*pass\b", authentication_results, re.I)
        for mechanism in ("spf", "dkim", "dmarc")
    )
    return EmailRecord(
        sender_address=sender,
        subject=subject,
        body=body,
        sent_at=parsed_sent_at,
        urls=urls,
        attachment_types=tuple(sorted(attachment_types)),
        reply_to=reply_to,
        infra_fingerprint=infra_fingerprint,
        thread_id=thread_id,
        authenticated=authenticated,
    )


def _infra_fingerprint(message: Any) -> str | None:
    originating_ip = message.get("X-Originating-IP")
    if originating_ip:
        return _normalized(str(originating_ip).strip("[]"))
    for received in message.get_all("Received", []):
        match = re.search(
            r"\bfrom\s+(\[[^\]]+\]|[A-Za-z0-9.-]+)",
            str(received),
            re.IGNORECASE,
        )
        if match:
            return _normalized(match.group(1).strip("[]"))
    return None


def _baseline_payload(baseline: SenderBaseline) -> dict[str, Any]:
    return {
        "senderAddress": baseline.sender_address,
        "sampleSize": baseline.sample_size,
        "knownLinkDomains": list(baseline.known_link_domains),
        "knownAttachmentTypes": list(baseline.known_attachment_types),
        "knownReplyTo": list(baseline.known_reply_to),
        "knownInfraFingerprints": list(baseline.known_infra_fingerprints),
        "sendHourRange": list(baseline.send_hour_range),
        "hasRequestedPayment": baseline.has_requested_payment,
        "hasRequestedCredentials": baseline.has_requested_credentials,
        "hasRequestedBankDetailChanges": baseline.has_requested_bank_detail_changes,
        "medianLength": baseline.median_length,
        "urgencyRate": baseline.urgency_rate,
    }


def _verdict_payload(verdict: AnalyzerVerdict) -> dict[str, Any]:
    return {
        "analyzerId": verdict.analyzer_id,
        "level": verdict.level,
        "score": verdict.score,
        "confidence": verdict.confidence,
        "signals": [
            {"id": signal.id, "weight": signal.weight, "detail": signal.detail}
            for signal in verdict.signals
        ],
        "rationale": verdict.rationale,
        "rulesetVersion": verdict.ruleset_version,
    }


def _domain_indicators(sender: str, raw_email: str) -> list[str]:
    indicators: list[str] = []
    sender_domain = sender.rsplit("@", 1)[-1].lower().strip(" >")
    urls = URL_PATTERN.findall(raw_email)
    if urls:
        indicators.append(f"Email contains {len(urls)} URL(s); review destinations manually.")

    domains = {
        urlparse(url.rstrip(".,);")).hostname.lower()
        for url in urls
        if urlparse(url.rstrip(".,);")).hostname
    }
    if sender_domain and any(domain != sender_domain for domain in domains):
        indicators.append("A link domain differs from the sender domain.")
    if any(char in sender_domain for char in "0123456789") and any(
        word in sender_domain for word in ("microsoft", "google", "paypal", "amazon")
    ):
        indicators.append("Sender domain contains a brand name and digits.")
    return indicators


def analyze_incident(
    subject: str,
    sender: str,
    raw_email: str,
    *,
    now: datetime,
    sender_history: Sequence[EmailRecord] = (),
) -> dict[str, Any]:
    """Run transparent, offline heuristics; this does not contact external systems."""
    current = email_record_from_raw(sender, subject, raw_email, sent_at=now)
    baseline = build_sender_baseline(
        sender_history,
        sender_address=sender,
        thread_id=current.thread_id,
    )
    sender_behavior = analyze_sender_behavior(current, baseline, now=now)
    content = f"{subject}\n{raw_email}".lower()
    evidence: list[str] = []
    if any(term in content for term in URGENCY_TERMS):
        evidence.append("Urgency or account-pressure language detected.")
    if any(term in content for term in CREDENTIAL_TERMS):
        evidence.append("Credential or financial-account language detected.")
    evidence.extend(_domain_indicators(sender, raw_email))

    score = min(100, 15 + len(evidence) * 22)
    if sender_behavior.trust_discount_applied:
        score = max(0, score - ANALYSIS_CONFIG["trusted_sender_risk_discount"])
    risk = (
        "high"
        if score >= ANALYSIS_CONFIG["base_risk_thresholds"]["high"]
        else "medium"
        if score >= ANALYSIS_CONFIG["base_risk_thresholds"]["medium"]
        else "low"
    )
    risk_rank = {level: rank for rank, level in enumerate(SENDER_LEVELS)}
    if risk_rank[sender_behavior.verdict.level] > risk_rank[risk]:
        risk = sender_behavior.verdict.level
        score = max(score, sender_behavior.verdict.score)
    evidence.extend(
        signal.detail
        for signal in sender_behavior.verdict.signals
        if signal.id != "LOW_SAMPLE"
    )
    recommendation = (
        "Review the sender and links; consider containment after analyst verification."
        if risk == "high"
        else "Review the evidence and verify the sender before taking action."
        if risk == "medium"
        else "No strong heuristic indicators found; analyst review is still recommended."
    )
    return {
        "risk": risk,
        "riskScore": score,
        "evidence": evidence or ["No configured heuristic indicators matched."],
        "recommendation": recommendation,
        "senderBehavior": {
            "baseline": _baseline_payload(sender_behavior.baseline),
            "deviationScore": sender_behavior.deviation_score,
            "trustDiscountApplied": sender_behavior.trust_discount_applied,
            "trustDiscountRemoved": sender_behavior.trust_discount_removed,
            "verdict": _verdict_payload(sender_behavior.verdict),
        },
        "analyzerVerdicts": [_verdict_payload(sender_behavior.verdict)],
        "agents": [
            {
                "id": name.lower().replace(" ", "-"),
                "name": name,
                "role": role,
                "status": "completed",
                "lastRun": None,
            }
            for name, role in zip(
                AGENT_NAMES,
                (
                    "Classifies the reported incident using transparent heuristics",
                    "Reviews message content and link-domain indicators offline",
                    "Assigns a deterministic score and risk tier for analyst review",
                    "Creates a response proposal; never executes response actions",
                ),
                strict=True,
            )
        ],
    }
