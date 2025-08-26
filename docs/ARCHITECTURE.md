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
- Server actions and server modules back all authenticated writes; reads are split by runtime:
  - Server components/pages import from `web/lib/server/**` directly (no fetch to own API).
  - Client components use thin wrappers in `web/lib/api/**` that call `/api/**` routes.
- Contracts live in `docs/SERVER_ACTIONS.md` and `docs/MVP_TECH_SPEC.md`.

Collaborations
- Server module: `web/lib/server/collabs.ts` encapsulates DB access for collaborations (CRUD, tag joins, upvote toggle, threaded comments, hiring toggle).
- Server actions: `web/app/collaborations/actions.ts` provides typed endpoints for client components (`createCollabAction`, `updateCollabAction`, `deleteCollabAction`, `toggleCollabUpvoteAction`, `addCollabCommentAction`, `deleteCollabCommentAction`).
- Pages:
  - `/collaborations` (server): calls `listCollabs` directly and renders project type chips; defaults to `is_hiring=true`.
  - `/collaborations/new` (client): server action form for creation; DB tags via `useTags()`.
  - `/collaborations/[id]` (server): calls `getCollab`; renders owner-only hiring toggle (client) and threaded comments.
- Auth & RLS: all writes require authenticated Supabase session; RLS enforces owner-only writes and public reads for non-deleted rows. Hiring toggle updates `is_hiring` under owner session.
- Optimistic UI: upvote button and hiring toggle perform optimistic updates with rollback on server error; comments add/delete also use optimistic flows.

Projects (Stage 5)
- Implemented: `createProject`, `listProjects`, `getProject` in `web/lib/server/projects.ts` with Zod validation in `web/app/projects/schema.ts` and a server action `web/app/projects/actions.ts` for creation.
- Listing:
  - `/projects` (client component) calls `/api/projects/list` via `web/lib/api/projects.ts`.
  - Landing page `/` (server component) calls `listProjects` from `web/lib/server/projects` directly and uses safe fallbacks on errors/empty data.
- Sorting & Filters:
  - Recent: `created_at desc`.
  - Popular: in-memory order by upvote count (from `project_upvotes`) then `created_at desc`.
  - Tag filters: AND across types (technology/category), OR within a type.

Admin Routes
- `/admin` — dashboard for admin-only actions (email allowlist via `ADMIN_EMAILS`)
- `/admin/tags` — tag governance: list existing tags and create new ones
  - Reads use anonymous/public client (RLS select)
  - Writes use service role client on the server; never exposed to the client
  - Admin auth is validated on the server using `getServerSupabase().auth.getUser()` and an email allowlist from `ADMIN_EMAILS` (no client token parsing).

Security & RLS
- All writes happen under authenticated sessions; RLS policies enforce owner-only writes and soft delete. See `supabase/rls_policies.sql` and summary in `supabase/schema.md`.

References
- Env & setup: `ops/ENVIRONMENT.md`
- Schema details: `supabase/schema.md`
- Server actions contracts: `docs/SERVER_ACTIONS.md`
- Auth details: `docs/AUTH.md`

