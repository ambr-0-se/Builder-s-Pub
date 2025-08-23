Server Actions (Contracts)

Purpose: Concise contracts for API/server actions referenced by the MVP. Shapes match `docs/MVP_TECH_SPEC.md`.

Conventions
- Validate inputs with clear error messages; return typed errors for UX (e.g., `validation_error`, `unauthorized`, `conflict`).
- Enforce RLS expectations: all writes require authenticated user; owner-only updates/deletes.
- Pagination: cursor-based where specified; default `limit=20`.

Projects
- createProject(input): `{ title, tagline, description, demoUrl, sourceUrl?, techTagIds[], categoryTagIds[] } -> { id } | validation_error`
- listProjects(params): `{ cursor?, limit=20, sort='recent'|'popular', q?, techTagIds?, categoryTagIds? } -> { items[], nextCursor? }`
- getProject(id): `-> { project, tags: {technology[], category[]}, upvoteCount, comments[], hasUserUpvoted }`
  - comments: top-level newest→oldest; replies oldest→latest; `children[]`, `upvoteCount`, `parentCommentId`, `hasUserUpvoted` (fully implemented)
- toggleProjectUpvote(projectId): `-> { ok: true, upvoted: boolean } | { error: 'unauthorized' }`
- updateProject(id, fields): owner-only `-> { ok: true }`
- deleteProject(id): owner-only `-> { ok: true }`

Implemented (Stage 5)
- createProject: Implemented. Validates inputs; inserts into `projects` with `owner_id=auth.user.id`; persists tags via `project_tags`; returns `{ id }` or `{ fieldErrors?, formError? }`.
- listProjects: Implemented (subset). Supports `limit` (default 20), `sort=recent|popular`, and tag filters (AND across types, OR within a type). Keyword `q` is deferred to Stage 9. Returns `{ items[], nextCursor? }`.
- getProject: Implemented. Returns project, tags grouped by type, owner display name, and `upvoteCount`. Comments updated in Stage 6.

Locations
- Server: `web/lib/server/projects.ts`
- Server actions: `web/app/projects/actions.ts` (`createProjectAction`, `addCommentAction`, `deleteCommentAction`, `addReplyAction`, `toggleProjectUpvoteAction`, `toggleCommentUpvoteAction`)

Comments
- addComment(projectId, body 1–1000): `-> { id }`
- deleteComment(commentId): author-only `-> { ok: true }`
- addReply(projectId, parentCommentId, body 1–1000): `-> { id }` (parent must be top-level and same project)
- toggleCommentUpvote(commentId): `-> { ok: true, upvoted: boolean } | { error: 'unauthorized' }`

Collaborations
- createCollab(input): `{ kind, title, description, skills[], region?, commitment? } -> { id }`
- listCollabs(params): `{ cursor?, limit=20, q?, kind?, skills? } -> { items[], nextCursor? }`
- getCollab(id), updateCollab(id, fields), deleteCollab(id): owner-only modifies

Validation (UX)
- Respect limits: Title ≤80, Tagline ≤140, Description ≤4000; URLs must be `http/https`.
- Tag rules: at least one technology and one category.
- Comments/Replies: 1–1000 chars; reply allowed only 1 level.
- Friendly errors: 401/403/409 with actionable messages; retry for 500.

Implementation Pointers
- Actions should live under `web/app/**/actions.ts` or `web/lib/server/**`.
- Use Supabase client on the server for DB operations; never expose service role key to client.
- Index usage: leverage schema indexes for sort/search (see `supabase/schema.md`).
- Degrade gracefully if migrations aren’t applied (e.g., fallback to flat comments when threaded columns are missing).

Conventions (Search)
- Case-insensitive substring matching for `q`.
- Ranking:
  - Projects: prioritize title > tagline > description; tie-break by upvotes desc, then created_at desc.
  - Collaborations: title/description/skills match; tie-break by created_at desc.

References
- Tech Spec: `docs/MVP_TECH_SPEC.md`
- Schema & RLS: `supabase/schema.md`, `supabase/rls_policies.sql`
- Auth: `docs/AUTH.md`

Profiles (Stage 3)
- getMyProfile(): `-> { profile: { userId, displayName, bio?, githubUrl?, linkedinUrl?, websiteUrl? } | null, isAuthenticated: boolean, error? }`
- updateMyProfile(formData): `-> UpdateProfileState | null` where `UpdateProfileState = { fieldErrors?: Record<string,string>; formError?: string } | null`
  - Submits via a server action form: `<form action={updateMyProfile}>`
  - Validation: display_name 1–80; bio ≤ 4000; building_now/looking_for ≤ 280; contact ≤ 200; URLs must be `http/https`. Writes occur under user session; RLS enforces owner-only updates.
  - On success: `revalidatePath('/profile')` then `redirect('/profile')`.
  - Auto-create on first sign-in via `/api/profile/ensure` (called by `/auth/callback`).

Implementation notes
- Prefer server action forms over client `fetch` + API routes for authenticated writes.
- Use `useFormState/useFormStatus` in a client component for inline errors and pending state.

Admin (Tags)
- createTag(formData): `{ name, type }` -> `{ success: true, tag: { id, name, type } } | { fieldErrors?, formError? }`
  - Admin-only via `isAdmin()` and service role client (server-only)
  - On success, returns the inserted tag for optimistic UI updates; revalidates `/`, `/projects`, `/search`, `/admin/tags`

