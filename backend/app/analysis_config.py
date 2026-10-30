from __future__ import annotations

from typing import Final, TypedDict


class AnalysisConfig(TypedDict):
    ruleset_version: str
    signal_weights: dict[str, int]
    trust_break_threshold: int
    minimum_baseline_sample_size: int
    urgency_spike_rate_delta: float
    trusted_sender_risk_discount: int
    base_risk_thresholds: dict[str, int]
    risk_floor_thresholds: dict[str, int]
    approval_ttl_minutes: dict[str, int]


ANALYSIS_CONFIG: Final[AnalysisConfig] = {
    "ruleset_version": "trusted-sender-v1",
    "signal_weights": {
        "NEW_LINK_DOMAIN": 25,
        "REPLY_TO_CHANGED": 25,
        "INFRA_CHANGED": 15,
        "FIRST_PAYMENT_REQUEST": 30,
        "BANK_DETAIL_CHANGE": 30,
        "FIRST_CREDENTIAL_REQUEST": 25,
        "UNUSUAL_SEND_TIME": 10,
        "URGENCY_SPIKE": 15,
        "NEW_ATTACHMENT_TYPE": 15,
        "LOW_SAMPLE": 0,
    },
    "trust_break_threshold": 25,
    "minimum_baseline_sample_size": 3,
    "urgency_spike_rate_delta": 0.1,
    "trusted_sender_risk_discount": 20,
    "base_risk_thresholds": {"medium": 40, "high": 70},
    "risk_floor_thresholds": {"medium": 25, "high": 70},
    "approval_ttl_minutes": {
        "default": 60,
        "medium": 30,
        "high": 15,
        "critical": 5,
    },
}
