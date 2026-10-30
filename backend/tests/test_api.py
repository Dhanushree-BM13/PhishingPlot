from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_api_health_reports_ok() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_trusted_partner_with_new_link_bank_change_and_click_is_critical() -> None:
    response = client.post(
        "/api/analyze",
        json={
            "subject": "Updated remittance details",
            "sender": "ap@partner.example",
            "body": "We changed our bank account. Please send payment to the new account.",
            "urls": ["https://remittance-update.example/details"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["risk"] == "critical"
    assert data["senderBehavior"]["baseline"]["sampleSize"] == 8
    assert data["senderBehavior"]["trustDiscountRemoved"] is True
    signal_ids = {signal["id"] for signal in data["senderBehavior"]["verdict"]["signals"]}
    assert {"NEW_LINK_DOMAIN", "FIRST_PAYMENT_REQUEST", "BANK_DETAIL_CHANGE"} <= signal_ids


def test_analyze_rejects_empty_body() -> None:
    response = client.post(
        "/api/analyze",
        json={"subject": "Hi", "sender": "a@b.example", "body": "", "urls": []},
    )

    assert response.status_code == 422


def test_password_reset_scenario_runs_all_agents_and_matches_logs() -> None:
    response = client.post(
        "/api/analyze",
        json={
            "subject": "Your password expires today",
            "sender": "it-support@company-helpdesk.example",
            "body": "Your password expires in 2 hours. Reset immediately to avoid lockout.",
            "urls": ["https://passwrd-reset-secure.example/login"],
        },
    )

    data = response.json()
    assert [agent["status"] for agent in data["agents"]] == ["completed"] * 4
    assert data["risk"] == "critical"
    assert any(event["user"] == "j.rao@company.example" for event in data["logMatches"])
    assert all(action["status"] == "pending_approval" for action in data["recommendedActions"])
    assert any(action["id"].startswith("reset-") for action in data["recommendedActions"])


def test_failing_agent_is_recorded_without_crashing(monkeypatch) -> None:
    from app import orchestrator

    def broken(case):
        raise RuntimeError("threat feed unavailable")

    monkeypatch.setattr(
        orchestrator,
        "PLAN",
        (orchestrator.PLAN[0], ("investigator", "Investigation Agent", broken), *orchestrator.PLAN[2:]),
    )
    response = client.post(
        "/api/analyze",
        json={"subject": "Hi", "sender": "a@b.example", "body": "Hello", "urls": []},
    )

    statuses = {agent["id"]: agent["status"] for agent in response.json()["agents"]}
    assert response.status_code == 200
    assert statuses["investigator"] == "failed"
    assert statuses["triage"] == "completed"
