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
- As a user, I can filter by technology/category tags and search by title/description.
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
- /search?q=...&tech=...&cat=...

Server Actions / API Contracts (shapes)
- createProject(input): { title, tagline, description, demoUrl, sourceUrl?, techTagIds[], categoryTagIds[] } -> { id } | validation_error
- listProjects(params): { cursor?, limit=20, sort='recent'|'popular', techTagIds?, categoryTagIds? } -> { items[], nextCursor? }
- getProject(id): -> { project, tags: {technology[], category[]}, upvoteCount, comments[] }
- upvoteProject(projectId): -> { ok: true } | { error: 'conflict'|'unauthorized' }
- addComment(projectId, body): -> { id }
- deleteComment(commentId): -> { ok: true }
- updateProject(id, fields): owner-only -> { ok: true }
- deleteProject(id): owner-only -> { ok: true }

- createCollab(input): { kind, title, description, skills[], region?, commitment? } -> { id }
- listCollabs(params): { kind?, skills?, cursor?, limit=20 } -> { items[], nextCursor? }
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
- Search: case-insensitive substring over title + description (DB index-backed).
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

References
- Schema: `supabase/schema.sql` and `supabase/schema.md`
- RLS: `supabase/rls_policies.sql`
- NFRs: `docs/NFR.md`
- Analytics: `docs/ANALYTICS.md`

