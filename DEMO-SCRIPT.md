# PhishPilot — 5-minute live demo (follows the deck)

**Before you go on stage**
- Terminal 1: `npm run dev` → http://localhost:5173
- Terminal 2: `.venv\Scripts\python -m uvicorn app.main:app --app-dir backend --port 8000`
- Header shows **API CONNECTED**. Reload right before presenting (fresh demo state).
- Close alert pop-ups (top right, small ×) before using **Demo controls**.

---

## 1. Problem (20s) — Dashboard
> "Phishing reports are handled manually, slowly and inconsistently. Analysts jump between emails, URLs and
> logs, and evidence gets missed."

## 2. Live demo scenario from slide 5 (2 min) — **Investigate email**
1. Click **Password-reset phish** → **Analyze email**.
2. Watch the four agents finish one after another:
   - **Triage** extracts sender, link and indicators (urgency, password request).
   - **Investigator** flags `passwrd-reset-secure.example` and finds the **matching log events**:
     j.rao opened the link, submitted the form, then signed in from a new IP.
   - **Risk Reviewer** cross-checks 3 of 3 evidence sources → **CRITICAL**, with each reason listed.
   - **Response** drafts: quarantine, block domain, force password reset.
3. Scroll to **Human approval gate**: nothing runs until you approve. Approve one → audit line appears,
   marked *simulated, no external action executed*.
> "All agents complete their roles, evidence is visible, and no unsafe action runs without approval."
> That's our success criteria from the deck.

## 3. The hurdle (2 min) — sidebar → **Hurdle guide**
One screen, three traps. Point at the workflow strip, then:
- **01 Trusted sender turns** → *Open case study*. SPF/DKIM/DMARC pass; new link + first payment request +
  bank change = 85 → trust discount removed → HIGH.
  > "Authentication says trusted. Behavior says compromised."
  Optional: Investigate email → **Trusted sender anomaly** runs the same logic live on the backend.
- **02 Link drifts** → *Open · press +2h* → Demo controls → **Advance +2h** → approval **invalidated**.
  > "When the evidence changes, the approval dies."
- **03 Analysts disagree** → *Open · try Approve* → Approve is locked → type a reason → Approve → **Audit**.
  > "We don't average it away. A human decides, and says why."

## 4. Close (20s)
> "PhishPilot turns one reported email into a traceable, evidence-backed decision. Agents investigate,
> the analyst decides, and every step is audited."

---

## If a judge asks…
- **"Is it real AI?"** The agents are transparent, rule-based Python modules run by an orchestrator over a
  shared case record (`backend/app/orchestrator.py`). LLM reasoning is the next step; rules make every
  verdict explainable and reproducible today.
- **"What if an agent fails?"** It's marked *failed* on its card and the rest still run (covered by a test).
- **"Real logs / real inbox?"** No, by design: synthetic logs and simulated actions. Links are never opened.
- **"Can I try it?"** Deployable on Vercel. See `DEPLOY.md`.
