from __future__ import annotations

from datetime import datetime, timedelta

from .agents import EmailRecord

DEMO_PARTNER_SENDER = "ap@partner.example"


def demo_sender_history(sender: str, *, now: datetime) -> tuple[EmailRecord, ...]:
    """Synthetic prior messages so the stateless analyze endpoint has a sender baseline."""
    if sender.strip().lower() != DEMO_PARTNER_SENDER:
        return ()
    return tuple(
        EmailRecord(
            sender_address=DEMO_PARTNER_SENDER,
            subject=f"Monthly statement {index + 1}",
            body="Attached is the regular statement for your records. "
            "Documents are on https://portal.partner.example/statements as usual.",
            sent_at=(now - timedelta(days=7 * (index + 1))).replace(
                hour=9 + index, minute=15, second=0, microsecond=0
            ),
            urls=("https://portal.partner.example/statements",),
            attachment_types=("application/pdf",),
            reply_to=DEMO_PARTNER_SENDER,
            infra_fingerprint="mx.partner.example",
            authenticated=True,
        )
        for index in range(8)
    )
