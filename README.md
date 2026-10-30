# 🛡️ PHISHPILOT
### Agentic AI & Multi-Agent System for Phishing Incident Investigation and Response

**Team Name:** Blueprints Architects  
**Team ID:** AH-10

## 📌 Problem Statement
Phishing emails are handled manually, making investigation slow and inconsistent. Analysts may miss suspicious links, domains, and evidence, leading to account takeovers and data exposure.

## 💡 Proposed Solution
PhishPilot is an AI-powered multi-agent system that investigates phishing emails, analyzes suspicious URLs, assesses risks, and recommends safe response actions with human approval.

## 🤖 AI Agents

1. **Triage Agent** – Extracts sender details, links, and suspicious indicators.
2. **Investigation Agent** – Checks URLs, domains, and security logs.
3. **Risk Reviewer Agent** – Analyzes evidence and calculates risk levels.
4. **Response Agent** – Recommends actions for analyst approval.

## ⚙️ Key Features
- Phishing email and URL submission.
- Automated multi-agent investigation.
- Evidence collection and analysis.
- Low, Medium, and High risk classification.
- Human approval mechanism.
- Incident management dashboard.
- Audit logs and investigation history.

## 🏗️ Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI
- **Database:** Supabase (PostgreSQL)
- **AI:** LLM-based agents and orchestration

## 🔄 Workflow

1. User submits a suspicious email or URL.
2. Triage Agent extracts indicators.
3. Investigation Agent collects evidence.
4. Risk Reviewer evaluates the threat.
5. Response Agent generates recommendations.
6. Human analyst approves or rejects the action.
7. Final results are stored in the database.

## 🔐 Security
- Secure authentication.
- Role-based access control.
- Row Level Security (RLS).
- Human approval before response actions.
- Auditable incident records.

## 🎯 Expected Outcome
A working prototype that makes phishing investigation faster, smarter, more transparent, and reliable through multi-agent collaboration.

## 🚀 Future Scope
- Real-time phishing detection.
- Advanced threat intelligence integration.
- Email security platform integration.
- Automated incident reporting.

## 👥 Team Members
- Dhanushree B M
- Mahima Bharadwaj
- Amulya R

**Team:** Blueprints Architects

---

### ⚠️ Prototype Note
The initial prototype uses synthetic data and simulated response actions. No real inbox access, automatic account disabling, or live domain blocking is performed.

## 📄 License
This project is developed for hackathon and educational purposes.
