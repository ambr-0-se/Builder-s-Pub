Environment & Setup (MVP)

> Purpose: Lists required environment variables and local setup steps; references DB migrations and safety notes.
> See also: [Supabase README](../supabase/README.md) · [Schema SQL](../supabase/schema.sql) · [RLS policies](../supabase/rls_policies.sql) · [MVP Tech Spec](../docs/MVP_TECH_SPEC.md)

Required Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-only; never exposed to client)
- NEXT_PUBLIC_POSTHOG_KEY (optional, analytics)
- NEXT_PUBLIC_POSTHOG_HOST (optional, defaults to https://us.posthog.com)

Node & Tooling
- Node.js 18+ (LTS recommended)
- Package manager: npm or pnpm

Local Setup
1) Copy `web/.env.local.example` to `web/.env.local` and fill values.
2) Install deps: `cd web && npm install --legacy-peer-deps`
3) Supabase schema: in Supabase SQL editor, run `supabase/schema.sql`, then `supabase/rls_policies.sql`.
4) Seed data (optional): run `supabase/seed/seed_mvp.sql` in SQL editor to add baseline tags.
5) Auth: enable Email (magic link) in Auth → Providers. Set redirect URLs:
   - Local: `http://localhost:3002/auth/callback`
   - Prod: `https://<your-domain>/auth/callback`
6) Start app: `npm run dev -- -p 3002` (from `web/`)

Notes
- Service role key must only be used on the server (Edge Functions or server actions).
- Prefer server actions or RPC for writes; avoid exposing privileged operations to the client.
 - Verify RLS by testing: anonymous can read public content; only owners can write/delete their content.

