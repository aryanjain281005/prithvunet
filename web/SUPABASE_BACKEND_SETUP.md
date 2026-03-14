# PrithviNet Supabase Backend Setup

This setup enables the full backend foundation for:
- AI Copilot logging
- What-if simulation persistence
- AI report generation
- Public complaint intake + triage
- Citizen recommendation/location/subscription data

## 1. Create Supabase Project

1. Open Supabase and create a new project.
2. Copy:
   - Project URL
   - Anon key
   - Service role key

## 2. Apply SQL Schema

1. Open SQL Editor in Supabase.
2. Paste the contents of `supabase-schema.sql`.
3. Run the script once.

This will create both existing admin tables and new AI backend tables.

If you already have old tables and only want to add AI backend tables safely, run:

- `supabase-ai-extension.sql`

This incremental file does not drop existing tables.

For production hardening after the extension is in place, run:

- `supabase-ai-production-rls.sql`

Apply the production RLS file only after you have either:
- configured `SUPABASE_SERVICE_ROLE_KEY` for server routes, or
- moved user auth to Supabase Auth with JWT role claims

## 3. Configure Environment Variables

Copy `.env.example` to `.env.local` in the `web` folder and set values:

```bash
cp .env.example .env.local
```

Required values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

Note:
- Current dev mode works with anon fallback for easier setup.
- Production-grade RLS expects `SUPABASE_SERVICE_ROLE_KEY` on the server.

## 4. Start the App

```bash
npm install
npm run dev
```

## 5. Backend Endpoints Now Available

- `POST /api/public/complaints`
  - Stores complaint in `public_complaints`
  - Adds NLP-like triage event to `complaint_triage_events`

- `GET /api/public/complaints?limit=50`
  - Returns latest complaint records

- `GET /api/public/setup/status`
  - Verifies if required Supabase tables exist
  - Shows missing table names if schema is not applied yet

- `POST /api/copilot`
  - Existing AI response behavior
  - Persists interaction in `ai_copilot_logs`
  - Auto-persists what-if prompts in `ai_simulations`

- `POST /api/copilot/simulate`
  - Runs scenario simulation and stores in `ai_simulations`

  If AI tables are not created yet, this endpoint still works in runtime fallback mode and returns `persisted: false`.

- `GET /api/copilot/simulate?scenarioId=SIM-...`
  - Fetches stored simulation

- `POST /api/copilot/report`
  - Creates report from simulation and stores in `ai_simulation_reports`

  If AI tables are missing, report generation uses runtime fallback and response includes `source: "runtime"`.

- `GET /api/copilot/report?reportId=RPT-...`
  - Fetches stored report

## 6. Recommended Production Hardening

Before production deployment:
1. Tighten RLS policies (replace open policies with role-based access).
2. Use Supabase Auth users and map app roles in JWT claims.
3. Add rate limits for public complaint and copilot endpoints.
4. Add cron cleanup for expired simulation records using `expires_at`.
