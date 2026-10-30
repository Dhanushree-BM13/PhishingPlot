from datetime import UTC, datetime, timedelta

from app.agents import (
    EmailRecord,
    analyze_incident,
    analyze_sender_behavior,
    build_sender_baseline,
)

NOW = datetime(2026, 10, 30, 12, 0, tzinfo=UTC)


def _history_record(index: int, *, thread_id: str = "thread-1") -> EmailRecord:
    return EmailRecord(
        sender_address="ap@acme-partner.com",
        subject=f"Monthly statement update {index}",
        body="Attached is the regular statement for your records.",
        sent_at=NOW - timedelta(days=index, hours=3),
        urls=("https://portal.acme-partner.com/invoices",),
        attachment_types=("application/pdf",),
        reply_to="ap@acme-partner.com",
        infra_fingerprint="mx.acme-partner.com",
        thread_id=thread_id,
        authenticated=True,
    )


def test_analysis_returns_bounded_score_and_four_agent_steps() -> None:
    result = analyze_incident(
        "Urgent: verify your payroll account",
        "security@example.org",
        "Please sign in now: https://login.example.net/verify",
        now=NOW,
    )

    assert 0 <= result["riskScore"] <= 100
    assert result["risk"] in {"low", "medium", "high"}
    assert len(result["agents"]) == 4
    assert result["evidence"]
    assert "analyst" in result["recommendation"].lower()


def test_analysis_reports_no_indicators_without_claiming_safety() -> None:
    result = analyze_incident(
        "Team lunch",
        "events@example.org",
        "See you Friday.",
        now=NOW,
    )

    assert result["risk"] == "low"
    assert result["riskScore"] == 15
    assert result["evidence"] == ["No configured heuristic indicators matched."]
    assert "analyst review" in result["recommendation"]


def test_authenticated_sender_with_new_link_and_bank_change_is_high_risk() -> None:
    history = [_history_record(index) for index in range(8)]
    baseline = build_sender_baseline(
        history,
        sender_address="AP@acme-partner.com",
        thread_id="thread-1",
    )
    current = EmailRecord(
        sender_address="ap@acme-partner.com",
        subject="Updated remittance details",
        body="Please update our bank details to use the new account.",
        sent_at=NOW.replace(hour=9),
        urls=("https://new-remittance.example/portal",),
        reply_to="payments@external.example",
        infra_fingerprint="mx.unfamiliar.example",
        thread_id="thread-1",
        authenticated=True,
    )

    result = analyze_sender_behavior(current, baseline, now=NOW)
    analysis = analyze_incident(
        "Updated remittance details",
        "ap@acme-partner.com",
        (
            "Date: Fri, 30 Oct 2026 09:00:00 +0000\r\n"
            "Reply-To: payments@external.example\r\n"
            "Authentication-Results: mx.acme-partner.com; spf=pass; dkim=pass; dmarc=pass\r\n"
            "Received: from mx.unfamiliar.example\r\n"
            "References: <thread-1>\r\n\r\n"
            "Please update our bank details to use the new account. "
            "https://new-remittance.example/portal"
        ),
        now=NOW,
        sender_history=history,
    )
    signal_ids = {signal.id for signal in result.verdict.signals}

    assert result.verdict.level == "high"
    assert result.deviation_score >= 70
    assert result.trust_discount_removed
    assert not result.trust_discount_applied
    assert {"NEW_LINK_DOMAIN", "REPLY_TO_CHANGED", "FIRST_PAYMENT_REQUEST", "BANK_DETAIL_CHANGE"} <= signal_ids
    assert "authenticated" in result.verdict.rationale
    assert analysis["risk"] == "high"
    assert analysis["senderBehavior"]["trustDiscountRemoved"]


def test_consistent_trusted_sender_can_receive_trust_discount() -> None:
    history = [_history_record(index) for index in range(8)]
    baseline = build_sender_baseline(
        history,
        sender_address="ap@acme-partner.com",
        thread_id="thread-1",
    )
    current = EmailRecord(
        sender_address="ap@acme-partner.com",
        subject="Monthly statement",
        body="Sharing the regular statement for your records.",
        sent_at=NOW.replace(hour=9),
        urls=("https://portal.acme-partner.com/invoices",),
        attachment_types=("application/pdf",),
        reply_to="ap@acme-partner.com",
        infra_fingerprint="mx.acme-partner.com",
        thread_id="thread-1",
        authenticated=True,
    )

    result = analyze_sender_behavior(current, baseline, now=NOW)
    analysis = analyze_incident(
        "Monthly statement",
        "ap@acme-partner.com",
        (
            "Date: Fri, 30 Oct 2026 09:00:00 +0000\r\n"
            "Reply-To: ap@acme-partner.com\r\n"
            "Authentication-Results: mx.acme-partner.com; spf=pass; dkim=pass; dmarc=pass\r\n"
            "Received: from mx.acme-partner.com\r\n"
            "References: <thread-1>\r\n\r\n"
            "Sharing the regular statement for your records. "
            "https://portal.acme-partner.com/invoices"
        ),
        now=NOW,
        sender_history=history,
    )

    assert result.deviation_score < 25
    assert result.verdict.level == "low"
    assert result.trust_discount_applied
    assert not result.trust_discount_removed
    assert analysis["risk"] == "low"
    assert analysis["riskScore"] == 39
    assert analysis["senderBehavior"]["trustDiscountApplied"]


def test_low_sample_baseline_reduces_confidence_and_never_grants_trust_discount() -> None:
    history = [_history_record(1)]
    baseline = build_sender_baseline(
        history,
        sender_address="ap@acme-partner.com",
        thread_id="thread-1",
    )
    current = EmailRecord(
        sender_address="ap@acme-partner.com",
        subject="Monthly statement",
        body="Sharing the regular statement for your records.",
        sent_at=NOW.replace(hour=9),
        urls=("https://portal.acme-partner.com/invoices",),
        reply_to="ap@acme-partner.com",
        infra_fingerprint="mx.acme-partner.com",
        thread_id="thread-1",
        authenticated=True,
    )

    result = analyze_sender_behavior(current, baseline, now=NOW)

    assert any(signal.id == "LOW_SAMPLE" for signal in result.verdict.signals)
    assert result.verdict.confidence < 1
    assert not result.trust_discount_applied
