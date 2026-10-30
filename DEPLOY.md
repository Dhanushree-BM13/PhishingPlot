# Deploying PhishPilot

PhishPilot deploys as **one Vercel project with two services** (see [`vercel.json`](vercel.json)):

| Service | Root | Framework | Public path |
|---|---|---|---|
| `app` | `.` | TanStack Start | `/` (everything not under `/api`) |
| `backend` | `backend` | FastAPI (`backend/index.py`) | `/api/*` |

The browser calls the backend on the same domain (`/api/...`). On Vercel builds, `vite.config.ts`
defaults `VITE_CYBERGUARD_API_URL` to `/`, so no URL needs configuring and no CORS is involved.
The services don't call each other server-side, so there are no bindings.

## 0. Create the Supabase tables (once)

Supabase → your project → **SQL Editor** → **New query** → paste the whole of
[`supabase/migrations/20261031000000_investigations.sql`](supabase/migrations/20261031000000_investigations.sql)
→ **Run**. It is safe to run more than once.

## 1. Create the Vercel project

1. Vercel → **Add New → Project** → import `Dhanushree-BM13/PhishingPlot`.
2. Leave **Root Directory** empty. Vercel reads the `services` in `vercel.json`.
3. **Environment Variables** (used by the `backend` service):

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `SUPABASE_SECRET_KEY` | your `sb_secret_…` key (server only) |

4. **Deploy**. Then open `https://<your-domain>/api/health` and expect
   `{"status":"ok","version":"1.0.0","database":"connected"}`.

The sidebar's **API** and **DB** dots turn green once both are reachable.

## Local development

```sh
npm run dev                                                        # web app on :5173
.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --port 8000
```

`.env.local` points the web app at `http://127.0.0.1:8000`; `backend/.env` holds the Supabase keys.
`vercel dev` runs both services together the way production does.

## Checks

```sh
NITRO_PRESET=vercel npm run build   # produces .vercel/output
.venv/Scripts/python -m pytest -q   # backend tests
```

Lovable builds are unaffected: they don't set `VERCEL`, so the app stays in labeled demo mode there.
