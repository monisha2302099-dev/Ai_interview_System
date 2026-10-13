# Interview Lab Frontend

Phase 17 provides the React chatbot client for the FastAPI backend.

## Run

From the repository root, install dependencies and start Vite:

```bash
npm install --prefix frontend
npm run dev
```

Alternatively, run `npm run dev` from this directory. Vite prints the local
URL and port on startup; if port `5173` is busy, it automatically uses the
next available port.

The development server proxies `/api` to `http://localhost:8000` by default. This avoids browser `localhost` and CORS problems in forwarded/container environments. Set `VITE_API_URL` only when the frontend must call another backend directly:

```bash
VITE_API_URL=https://your-api.example.com npm run dev
```

The backend must be running separately with `uvicorn backend.app:app --reload --port 8000`.

## Authentication

Authentication uses Supabase email and password. To allow signup and login
without an email verification step, disable **Confirm email** in the Supabase
project's Auth settings. The frontend cannot override this project-level policy.

Before starting Vite, create `frontend/.env.local` with the URL and publishable
anon key from your Supabase project's API settings:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
```

Restart Vite after changing environment variables. If these values are absent,
the app displays a setup message rather than a blank page. The resume checker
remains available at `/resume-checker` without signing in; the dashboard and
other authenticated pages still require Supabase configuration.

The dashboard's streak and score cards use
[`20261012000000_practice_analytics.sql`](../supabase/migrations/20261012000000_practice_analytics.sql).
Apply that migration to the Supabase project before using the analytics cards.
The interview and resume pages call the FastAPI backend on port `8000`.

## Current surface

- Technical interview, DSA practice, and HR interview modes.
- Session-aware chat through `POST /chat`.
- New-session reset, starter prompts, loading state, errors, and copy response action.
- Responsive desktop sidebar and mobile navigation drawer.

The model remains a small educational checkpoint-backed system. The React app does not claim production-grade response quality.
