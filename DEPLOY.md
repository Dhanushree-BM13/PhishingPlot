# Deploying PhishPilot to Vercel

PhishPilot deploys as **two Vercel projects from the same repo**: the web app and the analysis API.

## 1. Backend (FastAPI analysis API)

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory:** `backend`
3. Framework preset: **Other** (Vercel detects Python from `requirements.txt`; `backend/index.py` exposes the FastAPI `app`).
4. Environment variable:
   - `FRONTEND_ORIGINS` = your web app URL, e.g. `https://phishpilot.vercel.app` (comma-separate several).
5. Deploy, then check `https://<backend-url>/api/health` → `{"status":"ok",...}`.

## 2. Web app (TanStack Start)

1. Vercel → **Add New → Project** → import the same repo.
2. **Root Directory:** repository root (leave empty).
3. `vercel.json` already sets the build. Nitro detects Vercel and writes `.vercel/output` (server function + static assets).
4. Environment variable (must be set **before** the build):
   - `VITE_CYBERGUARD_API_URL` = the backend URL from step 1 (no trailing slash).
5. Deploy. The header badge shows **API CONNECTED** when the backend is reachable; otherwise the app stays
   fully usable in labeled demo mode.

## Check locally

```sh
NITRO_PRESET=vercel npm run build   # produces .vercel/output
.venv/Scripts/python -m pytest -q   # backend tests
```

## Pages

`/` landing · `/dashboard` · `/investigation` (live 4-agent analysis) · `/incidents` · `/incidents/:id` ·
`/agents` · `/approvals` · `/alerts` · `/audit` · `/settings` · `/hurdle-guide` · `/hurdle/trusted-sender`

Lovable builds are unaffected: inside Lovable the build still targets its own hosting.
