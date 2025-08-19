Server Actions (Contracts)

Purpose: Concise contracts for API/server actions referenced by the MVP. Shapes match `docs/MVP_TECH_SPEC.md`.

Conventions
- Validate inputs with clear error messages; return typed errors for UX (e.g., `validation_error`, `unauthorized`, `conflict`).
- Enforce RLS expectations: all writes require authenticated user; owner-only updates/deletes.
- Pagination: cursor-based where specified; default `limit=20`.

Projects
- createProject(input): `{ title, tagline, description, demoUrl, sourceUrl?, techTagIds[], categoryTagIds[] } -> { id } | validation_error`
- listProjects(params): `{ cursor?, limit=20, sort='recent'|'popular', techTagIds?, categoryTagIds? } -> { items[], nextCursor? }`
- getProject(id): `-> { project, tags: {technology[], category[]}, upvoteCount, comments[] }`
- upvoteProject(projectId): `-> { ok: true } | { error: 'conflict'|'unauthorized' }` (PK: `project_id,user_id`)
- updateProject(id, fields): owner-only `-> { ok: true }`
- deleteProject(id): owner-only `-> { ok: true }`

Comments
- addComment(projectId, body 1–1000): `-> { id }`
- deleteComment(commentId): author-only `-> { ok: true }`

Collaborations
- createCollab(input): `{ kind, title, description, skills[], region?, commitment? } -> { id }`
- listCollabs(params): `{ kind?, skills?, cursor?, limit=20 } -> { items[], nextCursor? }`
- getCollab(id), updateCollab(id, fields), deleteCollab(id): owner-only modifies

Validation (UX)
- Respect limits: Title ≤80, Tagline ≤140, Description ≤4000; URLs must be `http/https`.
- Tag rules: at least one technology and one category.
- Friendly errors: 401/403/409 with actionable messages; retry for 500.

Implementation Pointers
- Actions should live under `web/app/**/actions.ts` or `web/lib/server/**` (to be added in later stages).
- Use Supabase client on the server for DB operations; never expose service role key to client.
- Index usage: leverage schema indexes for sort/search (see `supabase/schema.md`).

References
- Tech Spec: `docs/MVP_TECH_SPEC.md`
- Schema & RLS: `supabase/schema.md`, `supabase/rls_policies.sql`
- Auth: `docs/AUTH.md`

