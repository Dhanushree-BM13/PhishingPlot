# PHISHPILOT

PHISHPILOT is a responsive security operations dashboard for phishing incident
triage and response. The interface demonstrates an analyst workflow for reviewing
reported emails, monitoring investigation agents, assessing risk, and reviewing
proposed response actions.

> **Analysis limitations:** The local demo uses sample data. When configured,
> the backend runs deterministic, offline heuristics; it does not call an LLM,
> visit URLs, scan attachments, or execute mail/security actions. Every response
> item remains a proposal for a human decision.

## Features

- Security overview with incident and approval counts
- Incident list with search and risk filters
- Phishing incident submission form
- Offline analysis agent activity and heuristic risk scores
- Human approval queue with decisions persisted in Supabase
- Audit log view
- Responsive sidebar navigation and PHISHPILOT branding

## Showcase and demo data

The public landing page's scenario previews use local fixtures from `src/data/demo/`.
Every incident count, status, verdict, and link observation shown in those sections
is demo data, not a live operational metric. The fixtures illustrate deterministic,
offline analysis; they do not represent real customers or threat intelligence.

The showcase is illustrative. Real FastAPI-backed agent orchestration and live link
scanning are not implemented. Offline analysis cannot re-scan links at click time.
Approvals expire and can be invalidated on re-check to mitigate this limitation.
Approval records a decision only. No external action is executed.

## Tech stack

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite
- Tailwind CSS 4
- Vitest and Testing Library
- FastAPI and Supabase Auth/PostgREST

## Requirements

- Node.js compatible with the versions required by the installed Vite 8 toolchain
- npm

## Run locally

From the project directory:

```sh
npm install
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite in your browser. The port may vary if the
default port is already in use.

## Backend configuration

Copy `.env.example` to `.env.local` and set the public Supabase project URL/key
and FastAPI URL:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Apply `supabase/migrations/20261030000000_phishpilot_schema.sql` to the Supabase
project (for example, through the Supabase SQL editor). It creates the incident,
agent-run, approval, and audit tables and enables per-user row-level security.
The backend forwards the signed-in user's access token to Supabase so Postgres
RLS policies apply; never put a service-role key in the frontend.

Run the API from the repository root:

```powershell
Copy-Item backend\.env.example backend\.env
# Fill backend\.env with the same Supabase project URL and anon key.
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload
```

Set `FRONTEND_ORIGINS` in `backend\.env` if the frontend uses a different origin.
Endpoints include `GET/POST /incidents`, `GET /agents`, `GET /approvals`,
`POST /approvals/{id}/decision`, `GET /audit-logs`, and unauthenticated
`GET /health`. All application endpoints except health require a valid Supabase
session. The submitted email content is stored in the user's RLS-protected
incident row; configure appropriate data-retention and access policies before
using real incident data.

Approving or rejecting a proposal records the analyst decision only. No external
response action is executed. Heuristic outputs are not AI/model findings and
must not be treated as a definitive phishing verdict.

## Quality checks

```sh
npm test
npm run lint
npm run build
```

Backend unit tests:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests
```

## Project layout

- `src/routes/` — dashboard and analyst workflow pages
- `src/components/` — shared interface components
- `src/lib/api.ts` — API configuration and incident submission
- `src/lib/sample-data.ts` — clearly labeled example incidents, approvals, and
  audit entries
- `public/phishpilot-official-logo.png` — official PHISHPILOT logo and favicon
