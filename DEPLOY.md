# Deploying PhishPilot

PhishPilot deploys as **two Vercel projects from the same GitHub repo**
(`Dhanushree-BM13/PhishingPlot`): the API first, then the web app.

## 0. Create the Supabase tables (once)

Supabase → your project → **SQL Editor** → **New query** → paste the whole of
[`supabase/migrations/20261031000000_investigations.sql`](supabase/migrations/20261031000000_investigations.sql)
→ **Run**. It is safe to run more than once.

## 1. Backend (FastAPI agents API)

1. Vercel → **Add New → Project** → import `PhishingPlot`.
2. **Root Directory:** `backend` · **Framework Preset:** Other.
   (`backend/index.py` exposes the FastAPI app; `backend/vercel.json` routes every path to it.)
3. **Environment Variables:**

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `SUPABASE_SECRET_KEY` | your `sb_secret_…` key (server only, never in the web app) |
   | `FRONTEND_ORIGINS` | the web app URL from step 2, e.g. `https://phishpilot.vercel.app` |

   You won't know the web app URL yet: deploy once, then come back, set `FRONTEND_ORIGINS`
   and **Redeploy**.
4. Deploy, then open `https://<backend-url>/api/health`. Expect
   `{"status":"ok","version":"1.0.0","database":"connected"}`.

## 2. Web app (TanStack Start)

1. Vercel → **Add New → Project** → import `PhishingPlot` again.
2. **Root Directory:** leave empty (repo root). `vercel.json` sets the build; Nitro detects Vercel
   and outputs `.vercel/output`.
3. **Environment Variables** (must exist **before** the build, Vite inlines them):

   | Name | Value |
   |---|---|
   | `VITE_CYBERGUARD_API_URL` | the backend URL from step 1, no trailing slash |

4. Deploy. The sidebar shows **API** and **DB** dots green when both are connected. Without the
   backend the app still works in labeled demo mode.

## Check locally

```sh
NITRO_PRESET=vercel npm run build   # produces .vercel/output
.venv/Scripts/python -m pytest -q   # backend tests
```

Lovable builds are unaffected: inside Lovable the build still targets its own hosting.
