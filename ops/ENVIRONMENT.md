Environment & Setup (MVP)

> Purpose: Lists required environment variables and local setup steps; references DB migrations and safety notes.
> See also: [Supabase README](../supabase/README.md) · [Schema SQL](../supabase/schema.sql) · [RLS policies](../supabase/rls_policies.sql) · [MVP Tech Spec](../docs/MVP_TECH_SPEC.md) · [Architecture](../docs/ARCHITECTURE.md) · [Auth](../docs/AUTH.md) · [Server Actions](../docs/SERVER_ACTIONS.md)

Required Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-only; never exposed to client)
- ADMIN_EMAILS (comma-separated list of admin email addresses for tag management)
- NEXT_PUBLIC_POSTHOG_KEY (optional, analytics)
- NEXT_PUBLIC_POSTHOG_HOST (optional, defaults to https://us.posthog.com)

Node & Tooling
- Node.js 18.18–23.x (per `web/package.json` engines)
- Package manager: pnpm (via Corepack)

Local Setup
1) Copy `web/.env.local.example` to `web/.env.local` and fill values.
2) Enable Corepack and prepare pnpm:
   ```bash
   corepack enable
   corepack prepare pnpm@10 --activate
   ```
3) Install deps: `cd web && pnpm install --frozen-lockfile`
3) Supabase schema: in Supabase SQL editor, run `supabase/schema.sql`, then `supabase/rls_policies.sql`.
4) Seed data (optional): run `supabase/seed/seed_mvp.sql` in SQL editor to add baseline tags.
5) Auth: enable Email (magic link) in Auth → Providers. Set redirect URLs:
   - Local: `http://localhost:3002/auth/callback`
   - Prod: `https://<your-domain>/auth/callback`
   - Note: The app shows a confirmation screen at `/auth/check-email` after requesting a link; the callback must still point to `/auth/callback`.
6) Start app: `pnpm dev -- -p 3002` (from `web/`)

Status (local machine)
- Completed: `.env.local` configured with Supabase URL/keys; app runs on `http://localhost:3002`.
- Completed: Schema + RLS applied; `seed/seed_mvp.sql` executed.
- Completed: Auth email provider enabled; Dashboard Site URL set to `http://localhost:3002`; redirect added for `/auth/callback`.

Notes
- Service role key must only be used on the server (Edge Functions or server actions).
- Prefer server actions or RPC for writes; avoid exposing privileged operations to the client.
- Verify RLS by testing: anonymous can read public content; only owners can write/delete their content.
- Admin UI: accessible at `/admin/tags` for users listed in ADMIN_EMAILS environment variable.

