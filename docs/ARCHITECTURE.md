Architecture Overview

Purpose: High-level map of the MVP: runtime, data flow, auth, and where core logic lives.

Runtime
- Frontend: Next.js App Router (TypeScript). UI under `web/app`, components in `web/components`.
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss`; global styles `web/app/globals.css`.
- Auth: Supabase Auth (email magic link). Client in `web/lib/supabaseClient.ts`; hook in `web/lib/api/auth.ts`.
- Data: Supabase Postgres with RLS. Schema in `supabase/schema.sql` with overview in `supabase/schema.md`.

Auth Flow (Stage 2)
- Sign-in page `app/auth/sign-in`: submits email to `useAuth().signIn(email, { redirectTo })` → sends magic link.
- Callback `app/auth/callback`: completes session using URL (supports both PKCE `?code` and magic-link `#access_token`).
- Navbar uses `useAuth()` to render session state and sign-out.

Data Flow (MVP)
- Mock data layer in `web/lib/api/*` for projects/collabs; will be replaced by server actions in later stages.
- Server actions contracts are defined in `docs/SERVER_ACTIONS.md` and `docs/MVP_TECH_SPEC.md`.

Security & RLS
- All writes happen under authenticated sessions; RLS policies enforce owner-only writes and soft delete. See `supabase/rls_policies.sql` and summary in `supabase/schema.md`.

References
- Env & setup: `ops/ENVIRONMENT.md`
- Schema details: `supabase/schema.md`
- Server actions contracts: `docs/SERVER_ACTIONS.md`
- Auth details: `docs/AUTH.md`

