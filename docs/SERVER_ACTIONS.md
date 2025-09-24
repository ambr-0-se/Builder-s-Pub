Server Actions (Contracts)

Purpose: Concise contracts for API/server actions referenced by the MVP. Shapes match `docs/MVP_TECH_SPEC.md`.

Conventions
- Validate inputs with clear error messages; return typed errors for UX (e.g., `validation_error`, `unauthorized`, `conflict`).
- Enforce RLS expectations: all writes require authenticated user; owner-only updates/deletes.
- Pagination: cursor-based where specified; default `limit=20`.

Projects
- createProject(input): `{ title, tagline, description, demoUrl, sourceUrl?, techTagIds[], categoryTagIds[], logoPath? } -> { id } | validation_error`
  - Rate limit: 5 per day per user (`project_create` action, 24-hour window)
- listProjects(params): `{ cursor?, limit=20, sort='recent'|'popular', q?, techTagIds?, categoryTagIds? } -> { items[], nextCursor? }`
  - Note: when invoked via the API route (`/api/projects/list`) with a valid session, each item may include `hasUserUpvoted` based on the current user's upvotes (personalized server augmentation).
- getProject(id): `-> { project, tags: {technology[], category[]}, upvoteCount, comments[], hasUserUpvoted }`
  - comments: top-level newest→oldest; replies oldest→latest; `children[]`, `upvoteCount`, `parentCommentId`, `hasUserUpvoted` (fully implemented)
- toggleProjectUpvote(projectId): `-> { ok: true, upvoted: boolean } | { error: 'unauthorized'|'rate_limited' }`
- updateProject(id, fields): owner-only `-> { ok: true }`
- deleteProject(id): owner-only `-> { ok: true }`

Logos (Projects)
- requestProjectLogoUpload(projectId, { ext }): owner-only `-> { uploadUrl, path, maxBytes, mime }`
- requestNewProjectLogoUpload({ ext }): auth-only (used on create form before id exists) `-> { uploadUrl, path, maxBytes, mime }`
- setProjectLogo(projectId, path): owner-only `-> { ok: true }`
- clearProjectLogo(projectId): owner-only `-> { ok: true }`
  - Notes: server finalizes temp paths `project-logos/new/<userId>/…` by moving to `project-logos/<projectId>/…` on create/set.

Implemented (Stage 5 → updated in Stage 9)
- createProject: Implemented. Validates inputs; inserts into `projects` with `owner_id=auth.user.id`; persists tags via `project_tags`; returns `{ id }` or `{ fieldErrors?, formError? }`.
- listProjects: Implemented and updated in Stage 9. Supports `limit` (default 20), `sort=recent|popular`, keyword `q` (case-insensitive substring across title/tagline/description with simple ranking: title > tagline > description; tie-break by upvotes desc, then `created_at` desc), and tag filters (AND across technology/category; OR within a type). Returns `{ items[], nextCursor? }`.
- getProject: Implemented. Returns project, tags grouped by type, owner display name, and `upvoteCount`. Comments updated in Stage 6.

Locations
- Projects server: `web/lib/server/projects.ts`; actions: `web/app/projects/actions.ts` (`createProjectAction`, `addCommentAction`, `deleteCommentAction`, `addReplyAction`, `toggleProjectUpvoteAction`, `toggleCommentUpvoteAction`)
- Collaborations server: `web/lib/server/collabs.ts`; actions: `web/app/collaborations/actions.ts`

Comments
- addComment(projectId, body 1–1000): `-> { id }`
- deleteComment(commentId): author-only `-> { ok: true }`
- addReply(projectId, parentCommentId, body 1–1000): `-> { id }` (parent must be top-level and same project)
- toggleCommentUpvote(commentId): `-> { ok: true, upvoted: boolean } | { error: 'unauthorized' }`

Rate limits (server-enforced)
- Content creation: projects and collaborations max 5 per day per user (`project_create`, `collab_create` actions, 24-hour window).
- Comments: max 5 per minute per user (add/reply share separate buckets: `comment_add`, `reply_add`).
- Upvote toggles (project/comment/collaboration): max 10 per minute per user (`upvote_toggle`).
- On limit: server functions return `{ error: 'rate_limited', retryAfterSec }`.
- Server actions surface a friendly `formError` and include `retryAfterSec` for UI cooldown messaging.
- Daily limits show "Try again tomorrow" messaging; minute limits show "Please wait a bit" messaging.

Collaborations
- createCollab(input): `{ title≤160, affiliatedOrg?, projectTypes[], description 1–4000, stage, lookingFor[1..5]{ role, amount(1..99), prerequisite≤400, goodToHave≤400, description≤1200 }, contact≤200, remarks≤1000, techTagIds[], categoryTagIds[], logoPath? } -> { id } | validation_error`
  - Rate limit: 5 per day per user (`collab_create` action, 24-hour window)
- listCollabs(params): `{ cursor?, limit=20, q?, techTagIds?, categoryTagIds?, stages?, projectTypes?, mode?, role? } -> { items[], nextCursor? }` (defaults to `is_hiring=true`).
  - Auth-only (Stage 17): Requires an authenticated server session. Anonymous requests receive 401 at API routes; DB RLS denies anonymous selects.
  - UI note: On `/search`, switching to Collaborations while anonymous shows a login-required card and skips the API call.
  - Each item exposes `collaboration.logoUrl` (derived) and `collaboration.logoPath` (storage key). `logoUrl` is a public URL built from `logoPath`.
  - Empty or absent filters are ignored. Tag filters are AND across types, OR within a type. `stages?` is an array (OR inside stage facet).
- getCollab(id): `-> { collaboration, tags, owner, upvoteCount, hasUserUpvoted, comments }`
  - Auth-only (Stage 17): Requires an authenticated server session. Anonymous requests receive 401 at API routes; DB RLS denies anonymous selects.
  - UI note: When anonymous users visit `/collaborations`, the page renders a login-required screen instead of calling this API.
- updateCollab(id, fields): owner-only, fields optional: `{ title?, affiliatedOrg?, description?, stage?, lookingFor?, contact?, remarks?, isHiring? } -> { ok: true } | validation_error`
- deleteCollab(id): owner-only `-> { ok: true }`
- toggleCollabUpvote(collaborationId): `-> { ok: true, upvoted: boolean } | { error: 'unauthorized'|'rate_limited' }`
- addCollabComment(collaborationId, body 1–1000, parentCommentId?): `-> { id } | { error }`
- deleteCollabComment(commentId): `-> { ok: true } | { error }`

Logos (Collaborations)
- requestCollabLogoUpload(collabId, { ext }): owner-only `-> { uploadUrl, path, maxBytes, mime }`
- requestNewCollabLogoUpload({ ext }): auth-only (used on create form before id exists) `-> { uploadUrl, path, maxBytes, mime }`
- setCollabLogo(collabId, path): owner-only `-> { ok: true }`
- clearCollabLogo(collabId): owner-only `-> { ok: true }`
  - Notes: server finalizes temp paths `collab-logos/new/<userId>/…` by moving to `collab-logos/<collabId>/…` on create/set.

Errors

- reportError (API): `POST /api/errors/report`
  - Input: `{ message: string, context?: unknown, url?: string, userMessage?: string }`
  - Behavior: Enriches with anonymized user id (salted hash), user agent, and route; redacts emails and URL paths in `message`, `userMessage`, and `context`; rate limits using action `error_report` at 10/min per anonymized user hash (or IP fallback).
  - Output: `{ ok: true }` on success; `{ error: 'rate_limited', retryAfterSec }` on limit; `{ error: 'invalid_input' }` on bad payload.
  - Client: Global reporter listens to `window.onerror` and `unhandledrejection`, adds a throttled ring-buffer of breadcrumbs (recent routes/clicks), and posts to this endpoint. Manual reports are submitted via `/report-problem` server action using the same helper.

Validation (UX)
- Respect limits: Title ≤80, Tagline ≤140, Description ≤4000; URLs must be `http/https`.
- Tag rules: at least one technology and one category.
- Caps (per-facet):
  - Projects: Technology ≤ 5; Category ≤ 3.
  - Collaborations: Technology ≤ 5; Category ≤ 3. Project types do not count toward caps.
- Comments/Replies: 1–1000 chars; reply allowed only 1 level.
- Friendly errors: 401/403/409 with actionable messages; retry for 500.
 - Rate-limited actions include a friendly message plus optional cooldown seconds.

Implementation Pointers
- Actions should live under `web/app/**/actions.ts` or `web/lib/server/**`.
- Use Supabase client on the server for DB operations; never expose service role key to client.
- Index usage: leverage schema indexes for sort/search (see `supabase/schema.md`).
- Degrade gracefully if migrations aren’t applied (e.g., fallback to flat comments when threaded columns are missing).

Conventions (Search)
- Case-insensitive substring matching for `q`.
- Ranking:
  - Projects: prioritize title > tagline > description; tie-break by upvotes desc, then created_at desc.
  - Collaborations:
    - mode='role': prioritize role match > title > description; tie-break by created_at desc; `is_hiring=false` excluded by default.
    - mode='project' (default): prioritize title > description > role match; tie-break by created_at desc.
  - Filters for `stages[]`, `projectTypes[]`, `techTagIds`, `categoryTagIds` apply; empty filters are ignored.
- Facet “All” chip: selecting “All” for any facet is equivalent to no selection for that facet.

References
- Tech Spec: `docs/MVP_TECH_SPEC.md`
- Schema & RLS: `supabase/schema.md`, `supabase/rls_policies.sql`
- Auth: `docs/AUTH.md`

Placeholder policy
- When `logoUrl` is absent (no uploaded logo), UI renders a monogram avatar with a deterministic gradient background and 1–2 initials derived from the item title via `LogoImage`.
- A static `/placeholder-logo.svg` remains as a secondary fallback.
- After successful uploads, final image URLs are cache‑busted client‑side by appending a `?v=<timestamp>` query to ensure immediate refresh.

Storage cleanup & utilities
- deleteTempLogo(path): auth-only server action to delete a user's own temp object under `*/new/<userId>/…` (best-effort), used when replacing selection pre-submit.
- Scheduled cleanup: a GitHub Actions workflow runs daily to delete stale temp objects older than 24h; see `.github/workflows/cleanup-new-uploads.yml` and `web/scripts/cleanup-new-uploads.ts`.
- Backfill: one-off script `web/scripts/finalize-new-logos.ts` migrates any existing temp paths referenced in DB to canonical `<entityId>/…` and updates rows; supports `--dry-run`.

Profiles (avatars)
- requestProfileAvatarUpload({ ext }): auth-only `-> { uploadUrl, path, maxBytes, mime }`
- setProfileAvatar(path): auth-only `-> { ok: true }`
- clearProfileAvatar(): auth-only `-> { ok: true }`
  - UI: owner-only overlay on `/profile` header (size 96, rounded full). “Remove Avatar” available only on `/profile` overlay.

Profiles (Stage 3)
- getMyProfile(): `-> { profile: { userId, displayName, bio?, githubUrl?, linkedinUrl?, websiteUrl? } | null, isAuthenticated: boolean, error? }`
- updateMyProfile(formData): `-> UpdateProfileState | null` where `UpdateProfileState = { fieldErrors?: Record<string,string>; formError?: string } | null`
  - Submits via a server action form: `<form action={updateMyProfile}>`
  - Validation: display_name 1–80; bio ≤ 4000; building_now/looking_for ≤ 280; contact ≤ 200; URLs must be `http/https`. Writes occur under user session; RLS enforces owner-only updates.
  - On success: `revalidatePath('/profile')` then `redirect('/profile')`.

Implementation notes
- Prefer server action forms over client `fetch` + API routes for authenticated writes.
- Use `useFormState/useFormStatus` in a client component for inline errors and pending state.

Admin (Tags)
- createTag(formData): `{ name, type }` -> `{ success: true, tag: { id, name, type } } | { fieldErrors?, formError? }`
  - Admin-only via `isAdmin()` and service role client (server-only)
  - On success, returns the inserted tag for optimistic UI updates; revalidates `/`, `/projects`, `/search`, `/admin/tags`

