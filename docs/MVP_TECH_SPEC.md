MVP Technical Specification

> Purpose: Defines the implementable MVP (how) — user stories, acceptance criteria, routes, server actions, validation/UX states, tag governance, rate limits, DoD.
> See also: [PRD](../Product%20Requirement%20Document.md) · [NFR](NFR.md) · [Analytics](ANALYTICS.md) · [Schema overview](../supabase/schema.md) · [Schema SQL](../supabase/schema.sql) · [RLS policies](../supabase/rls_policies.sql) · [Environment](../ops/ENVIRONMENT.md)

Purpose
Define the minimal, runnable MVP in implementable detail. Product “what/why” remains in the PRD; this document covers “how” for engineering.

Tech Choices (MVP)
- Framework: React with Next.js (App Router) + TypeScript
- Styling: Tailwind CSS
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions)
- Data Access: Supabase client + server actions
- State/Fetching: React Query (for client) where needed

User Stories & Acceptance Criteria

Auth & Profile
- As a user, I can sign up/login via email magic link.
  - AC: Auth SDK flow; logout works; session restored on refresh.
- As a user, I can create/update my profile with display name (required), optional bio and links (GitHub, LinkedIn, website).
  - AC: URL validation; display name 1–80 chars; update only own profile.

Projects: Create/List/Detail
- As a builder, I can create a project with title, tagline, description, demo URL (required), optional source URL, ≥1 technology tag, ≥1 category tag.
  - AC: Title ≤80, Tagline ≤140, Description ≤4000; valid http/https demo URL; at least one tag per type; owner set to auth user; success redirect to detail.
- As a user, I can browse paginated projects sorted by recent or by popular.
  - AC: Default 20/page; sort=recent (created_at desc) or popular (upvotes desc, created_at desc).
- As a user, I can view a project detail page with demo embed, tags, upvotes, comments, and owner info.
  - AC: Embed YouTube/Vercel where possible; otherwise an External Link button.

Comments
- As an authenticated user, I can comment on a project.
  - AC: 1–1000 chars; author can delete own comment.

Upvotes
- As an authenticated user, I can upvote a project once.
  - AC: Enforced by DB PK (project_id, user_id); unvote is out of scope for MVP.

Discover/Search
- As a user, I can search projects and collaborations with optional keyword(s) and filters.
  - Projects: optional q (keywords), technology tags, category tags.
  - Collaborations: optional q (keywords), technology tags, category tags, `stages[]` (equals; OR within facet), and `projectTypes[]` (array overlap). Empty/“All” per facet is ignored.
  - AC: Filters are AND across tag types, OR within a type; case-insensitive substring search.

Collaboration Board
- As a user, I can post collaboration entries with type (ongoing, planned, individual, organization), title, description, skills list, optional region, and commitment.
  - AC: Owner can update/delete own post; public read; filter by type and skills substring.

Admin (MVP-light)
- Admins can soft-delete content flagged as spam/offensive.
  - AC: Soft-delete boolean hides from all listings. Admin UI is optional; service role may be used initially.

Routes (Information Architecture)
- / (landing: featured, trending, collab previews)
- /auth/callback (Supabase)
- /profile, /profile/edit
- /projects, /projects/new, /projects/[id]
- /collaborations, /collaborations/new, /collaborations/[id]
- /search?q=...&tech=...&cat=...&type=projects|collabs

Server Actions / API Contracts (shapes)
- createProject(input): { title, tagline, description, demoUrl, sourceUrl?, techTagIds[], categoryTagIds[] } -> { id } | validation_error
- listProjects(params): { cursor?, limit=20, sort='recent'|'popular', q?, techTagIds?, categoryTagIds? } -> { items[], nextCursor? }
- getProject(id): -> { project, tags: {technology[], category[]}, upvoteCount, comments[] }
- upvoteProject(projectId): -> { ok: true } | { error: 'conflict'|'unauthorized' }
- addComment(projectId, body): -> { id }
- deleteComment(commentId): -> { ok: true }
- updateProject(id, fields): owner-only -> { ok: true }
- deleteProject(id): owner-only -> { ok: true }

- createCollab(input): { title, affiliatedOrg?, projectTypes[], description, stage, lookingFor[], contact, remarks?, techTagIds[], categoryTagIds[] } -> { id }
- listCollabs(params): { cursor?, limit=20, q?, techTagIds?, categoryTagIds?, stages?, projectTypes? } -> { items[], nextCursor? }
- getCollab(id), updateCollab(id, fields), deleteCollab(id)

Validation & UX States
- Forms: client + server validation; disabled submit during pending; inline field errors; success toast + redirect.
- Lists: skeleton loaders; empty states with CTAs.
- Errors: human-friendly messages for 401/403/409; retry for 500.
- Demo embed: YouTube/Vercel recognized; else external link.

Tag Governance
- Tags are controlled vocabulary: `tags (name, type)`, unique (name,type).
- Only admins create new tags in MVP; users select existing.

Search & Trending
- Search (MVP algorithm):
  - Projects: case-insensitive substring over title, tagline, description.
  - Collaborations: case-insensitive substring over title, description, and skills list.
  - Ranking (projects): title match > tagline match > description match; tie-break by upvotes desc, then created_at desc.
  - Ranking (collabs): title/description/skills match; tie-break by created_at desc.
- Trending: order by upvotes desc, then created_at desc (simple MVP).

Rate Limits (MVP targets)
- Authenticated: project create ≤ 10/min/user; comment ≤ 20/min/user; upvote ≤ 60/min/user.
- Anonymous: read endpoints only; cache at CDN where possible.

Definition of Done (per feature)
- RLS policies in place and tested.
- Validation enforced (client + server).
- Tests: unit for utils; integration for server actions/happy paths.
- Analytics events instrumented.
- Docs updated: `supabase/schema.md` and this spec.
- If user-visible change: add a bullet to `CHANGELOG.md` under `## [Unreleased]`.

References
- Schema: `supabase/schema.sql` and `supabase/schema.md`
- RLS: `supabase/rls_policies.sql`
- NFRs: `docs/NFR.md`
- Analytics: `docs/ANALYTICS.md`


Development Plan (MVP)

> Practical, small stages aligned to the imported UI under `web/`. Each stage lists concrete tasks and a simple acceptance check. Create one PR per stage and prefer “Squash and merge”.

- Stage 0 — Stabilize UI scaffold (web/) -- Done
  - Tasks: add Node version (`engines` or `.nvmrc`), `web/.env.local.example`, run instructions in `web/README.md`.
  - Done when: fresh clone runs `pnpm install --frozen-lockfile && pnpm dev -p 3002` successfully.
  - Completed locally: `.env.local` created and app runs on `http://localhost:3002`.

- Stage 1 — Supabase project + schema -- Done
  - Tasks: create project; apply `supabase/schema.sql` and `supabase/rls_policies.sql`; run `supabase/seed/seed_mvp.sql`.
  - Done when: tables/RLS exist, seeds present; env vars documented in `ops/ENVIRONMENT.md` and `.env.local.example`.
  - Completed locally: schema + RLS applied; `seed_mvp.sql` executed; Auth → Email enabled; Site URL set to `http://localhost:3002`; redirect added for `/auth/callback`; env set in `web/.env.local`.

- Stage 2 — Auth (magic link) -- Done
  - Tasks: add `@supabase/supabase-js`; implement magic-link sign-in/out; session restore; `/auth/callback` handler; replace `useAuthMock()` with real hook.
  - Done when: sign in/out works; session persists; create/upvote/comment routes gate properly.

- Stage 3 — Profiles -- Done
  - Tasks: ensure profile auto-create for new users; implement view/edit with validation (display name 1–80, URL checks).
  - Implementation notes:
    - Auto-create via `/api/profile/ensure` called in `/auth/callback` after session is set (tokens passed once if cookies not present).
    - Server actions at `web/app/profile/actions.ts` handle `getMyProfile` and `updateMyProfile` under RLS.
    - Edit page uses server-fetched initial values and submits via a server action form with `useActionState` + `useFormStatus`.
    - Additional profile fields (preliminary): `x_url, region, timezone, skills[], building_now, looking_for, contact`.
    - Region/Timezone UI: country dropdown + timezone list from `@vvo/tzdb` (labels: `GMT±HH:MM — Abbr — IANA`, sorted by current offset).
  - Done when: user can read/update own profile; RLS blocks others.

- Stage 4 — Tags from DB (governance) -- Done
  - Tasks: load technology/category tags from DB; remove constants; keep admin-only creation in MVP.
  - Implementation: added `tags` RLS (public select), `web/lib/api/tags.ts`, `web/hooks/useTags.ts`; refactored `FilterBar`, `Projects/New`, `Search` to use DB tags; removed `web/constants/tags.ts`; updated mocks; added admin UI at `/admin/tags` with service-role client and email-based access control; fixed server-side tag loading to use anonymous client for public pages; fixed service client to be a utility function (not server action).
  - Done when: filters and forms use DB tags end-to-end; admins can create new tags via UI. (Met)

- Stage 5 — Projects core -- Done
  - Tasks: server actions `createProject`, `listProjects`, `getProject`; enforce field limits and valid demo URL; persist `techTagIds[]` and `categoryTagIds[]` via `project_tags`.
  - Implementation:
    - Validation with Zod at `web/app/projects/schema.ts` (Title ≤80, Tagline ≤140, Description ≤4000; URLs must be http/https; ≥1 tag per type).
    - Server functions at `web/lib/server/projects.ts`:
      - `createProject(input)` inserts into `projects` under the authenticated user (RLS), then inserts `project_tags`; returns `{ id }` or typed errors.
      - `listProjects(params)` returns `ProjectWithRelations[]`, supports `sort=recent|popular`, default `limit=20`, and tag filters (AND across types, OR within a type). Uses public anon client for reads.
      - `getProject(id)` returns project, tags, owner profile display name, and upvote count.
    - Create flow uses a server action at `web/app/projects/actions.ts` and redirects to `/projects/[id]` on success.
    - Listing page (`/projects`) uses a thin client wrapper `web/lib/api/projects.ts` that calls `/api/projects/list` and converts `createdAt` back to `Date`.
    - Landing page (`/) calls server module `web/lib/server/projects.ts` directly (server runtime) and falls back to empty lists if fetch fails.
    - Note: keyword search (`q`) is deferred to Stage 9; current `listProjects` ignores `q`.
  - Done when: create redirects to detail; list supports Recent/Popular and tag filters (AND across types, OR within type). (Met)

- Stage 6 — Comments — Done
  - Tasks: implement `addComment` and `deleteComment` (author-only); render comment list on project detail; add 1–1000 char validation; wire server actions and UI; add tests and docs.
  - Implementation:
    - ✅ Validation: add `commentSchema` (1–1000) in `web/app/projects/schema.ts`; export types for reuse.
    - ✅ Server: in `web/lib/server/projects.ts` add `addComment(projectId, body)` and `deleteComment(commentId)` using authenticated server client (RLS enforced); update `getProject(id)` to include `comments[]` with author display name and `createdAt`, sorted newest-first; add helper `fetchCommentsByProjectId`.
    - ✅ Server actions: in `web/app/projects/actions.ts` add `addCommentAction` and `deleteCommentAction` to process `FormData`, perform validation, and return typed errors; integrate with server action forms.
    - ✅ UI: create `web/components/features/projects/comment-form.tsx`, `web/components/features/projects/comment-list.tsx`, and `web/components/features/projects/comment-item.tsx`; update `web/components/features/projects/comment-cta.tsx` to show sign-in CTA for anonymous users and the actual form + list for authenticated users.
    - ✅ UX: disable submit while pending; inline validation errors; character counter; success toast; confirm before delete; friendly errors for 401/403/500.
    - ✅ Extended features: implemented 1-level comment replies with inline forms, comment upvotes with toggle functionality, and upvote state persistence for both projects and comments.
    - ✅ Database: added `parent_comment_id` to comments, `comment_upvotes` table, and related indexes/RLS policies.
    - ✅ Server functions: implemented `addReply`, `toggleCommentUpvote`, `toggleProjectUpvote` with proper validation.
    - ✅ UI components: generic `UpvoteButton` for both projects and comments with optimistic updates.
    - ✅ Tests: schema (comments), server (add/delete/reply/upvote), rate-limit coverage; optional UI smoke deferred.
    - ✅ Rate limits: per-user throttling (5 comments/min for add/reply; 10 upvote toggles/min).
    - ✅ Analytics: instrument comment add/delete, reply added, upvote toggled events.
  - Done when: authenticated user can add and delete own comments; non-authors cannot delete (RLS enforced); comments render with author name and timestamp; errors display clearly; tests pass; rate limits enforced; this spec and `docs/SERVER_ACTIONS.md` are updated. (Met)

- Stage 7 — Upvotes — Done
  - Tasks: `upvoteProject` enforcing single upvote (PK); optimistic UI with rollback; disable after upvote.
  - Implementation notes:
    - ✅ Most upvote functionality implemented in Stage 6: `toggleProjectUpvote`, `toggleCommentUpvote`, optimistic UI with rollback, upvote state persistence.
    - ✅ Single upvote enforcement via database PK constraints.
    - ✅ Upvote buttons disable after upvote and show correct visual state.
    - ✅ Rate limiting: per-user upvote toggles throttled (10/min/user).
    - ✅ Lists consistency: landing (Featured + Trending) and `/projects` use non-interactive `UpvoteButton`; if the signed-in user previously upvoted, the button appears darkened.
    - ✅ Personalization: `/api/projects/list` attaches `hasUserUpvoted` for authenticated users; anonymous users omit this field.
  - Done when: count updates instantly; duplicate upvotes are blocked with a friendly message; rate limits are enforced; list/landing show consistent non-interactive upvote UI with prior-upvote darkening. (Met)

- Stage 8 — Collaboration board
  - Scope: Replace mocks with real CRUD under RLS and expand fields per PRD. Provide form (`/collaborations/new`), list (`/collaborations`), and detail (`/collaborations/[id]`) with upvotes and comments.
  - Data model (MVP, implemented):
    - `collaborations` extended with: affiliated org, project_types text[], is_hiring, stage enum-ish text, looking_for jsonb, contact, remarks.
    - Relations: `collaboration_tags`, `collaboration_upvotes`, `collab_comments`.
  - UX: creation form, list with chips and hiring toggle, detail with comments.

- Stage 9 — Search + pagination
  - Tasks:
    - Implement unified /search supporting type=projects|collabs (tabs or param).
    - Add q? keyword search and ranking per “Search & Trending”.
    - Projects: support techTagIds/categoryTagIds (AND across types, OR within type).
    - Collaborations: support filters for techTagIds/categoryTagIds (AND/OR), `stages[]` (equals; OR within facet), and `projectTypes[]` (overlap). Include “All” chip per facet behaving as no filter.
    - Add cursor pagination (default 20/page) to both.
  - Done when:
    - /search returns expected results for both types with the ranking rules.
    - Tag/type filters and q can be used independently or together.

- Stage 10 — Demo embed + SEO
  - Tasks: `DemoEmbed` (YouTube/Vercel inline; else external link); add `Metadata` to key routes and OG on project detail.
  - Done when: supported demos embed; titles/descriptions render for core pages.

- Stage 11 — Rate limits (MVP-light)
  - Tasks: simple per-user throttling (edge function or table) for create/comment/upvote to meet targets.
  - Done when: excessive requests are rejected with clear UI.

- Stage 12 — Analytics
  - Tasks: replace analytics mock with provider or structured logging; instrument events per `docs/ANALYTICS.md`.
  - Done when: core flows emit events with required properties.

- Stage 13 — QA, docs, deploy
  - Tasks: happy-path tests for server actions; doc updates in this file and `supabase/schema.md`; deploy `web/` to Vercel.
  - Done when: green build on main; smoke tests pass on preview.

- Stage 14 — Collaboration visibility (auth-only)
  - Tasks: gate `/collaborations` and `/collaborations/[id]` behind authentication; anonymous users are redirected to sign-in or see a friendly login-required screen; update navbar/links to hide collaboration entry points for non-auth users; enforce RLS to deny `select` on collaboration tables for anon; update tests and docs accordingly.
  - Done when: non-logged-in users cannot view collaboration lists or details (server and client enforced); logged-in users retain normal access.

- Stage 15 - About us (Goal, Vision, Team), Error Page

