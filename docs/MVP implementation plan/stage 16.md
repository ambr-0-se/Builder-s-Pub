# Stage 16 Implementation Plan: Collaboration by Role (post + search)

**Status:** In Progress  
**Started:** 23/9/2025
**Completed:** —

## Overview

Enable collaboration discovery “by role” in addition to the existing “by project” flow, with a simple single search box in both modes. In “By role,” users get a split view (left: role‑focused results; right: full collaboration detail). The collaboration form gets a headless, creatable combobox for roles with suggestions from a curated `roles_catalog`. Under the hood, we index roles in a normalized join table `collaboration_roles` (derived from `looking_for[].role`) to support accurate, fast role search and ranking. “Closed” posts (`is_hiring=false`) must not appear in role results. Ranking differs by mode: By role prioritizes role>title>description; By project prioritizes title>description>role.

## Tasks

### 1. Database & Contracts
Add `collaboration_roles` (join) + `roles_catalog`, indexes, and extend server contracts to accept `mode` and `role` parameters with documented ranking.

### 2. Server Logic: Sync, Search & Ranking
Sync roles on create/update; implement role‑aware list with `is_hiring` enforcement and mode‑dependent ranking.

### 3. API & Client Plumb
Expose `mode` and `role` through the collaborations list API route and client wrapper.

### 4. UI: /collaborations (Filters + Single Search)
Introduce a client shell, unify filters (tech, category, stages, projectTypes) and one search box across modes.

### 5. UI: By Role Split View
Add split view with role suggestions (from `roles_catalog`), left result list (logo, role, project title), and right detail panel reusing `collaborations/[id]` content.

### 6. UI: Form Role Combobox
Replace role input in each `lookingFor[]` row with a headless “creatable” combobox (suggestions + free text) and prevent duplicate roles.

### 7. Analytics, Tests, Docs
Instrument `search_performed`/`filter_apply` with `search_mode`, add server/UI tests, update docs and changelog.


## Actionable and Specific Steps

### Step 1: DB migration — pg_trgm & collaboration_roles
**Goal:** Create normalized role index for accurate, fast role search.

**What we are doing:** Add a join table to store each collaboration’s roles (one row per role), with case‑insensitive uniqueness and trigram index for efficient substring search.

**Technical details:**
- SQL (new migration in `supabase/migrations/`):
  - `create extension if not exists pg_trgm;`
  - `create table if not exists collaboration_roles ( collaboration_id uuid not null references collaborations(id) on delete cascade, role text not null check (char_length(role) <= 80) );`
  - `create unique index if not exists uq_collab_roles_ci on collaboration_roles (collaboration_id, lower(role));`
  - `create index if not exists idx_collab_roles_role_trgm on collaboration_roles using gin (lower(role) gin_trgm_ops);`

**Files:**
- Add: `supabase/migrations/20250923163755_add_collaboration_roles.sql` (filename uses HK time `YYYYMMDDHHMMSS` per migrations/README.md)
- Change: `supabase/schema.md` (tables/indexes)
- Potentially affected: `web/lib/server/collabs.ts` (later steps will use this table)

**RLS:**
- Update `supabase/rls_policies.sql` to enable RLS and add policies for `collaboration_roles` (public select; owner-only insert/delete) and `roles_catalog` (public select).

**Tests:** Verified later in server tests (role sync + search ranking).

**Status:** Completed

---

### Step 2: DB migration — roles_catalog + seed
**Goal:** Provide curated role suggestions for inputs/search.

**What we are doing:** Create a simple catalog of popular role names; read‑only in MVP, admin‑curated later.

**Technical details:**
- SQL (new migration):
  - `create table if not exists roles_catalog ( id serial primary key, name text not null unique );`
  - Seed with an alphabetical list (e.g., Frontend Engineer, Backend Engineer, Full‑stack Engineer, Product Designer, Product Manager, Data Scientist, ML Engineer, Data Engineer, DevOps Engineer, QA Engineer, UI Engineer, UX Researcher, Growth / Marketing).

**Files:**
- Add: `supabase/migrations/20250923164504_add_roles_catalog.sql` (filename uses HK time `YYYYMMDDHHMMSS` per migrations/README.md)
- Change: `supabase/schema.md`

**Tests:** Not needed beyond basic select; exercised through UI in later steps.

**Status:** Completed

---

### Step 3: Contracts & types — listCollabs(mode, role)
**Goal:** Extend contracts to support mode‑aware role search.

**What we are doing:** Add optional `mode` and `role` params to list API and document ranking rules.

**Technical details:**
- Update types: `web/lib/types.ts` → `export interface ListCollabsParams { …; mode?: 'project'|'role'; role?: string }`
- Docs: `docs/SERVER_ACTIONS.md` → listCollabs(params) includes `mode?`, `role?` and ranking policy.

**Files:**
- Change: `web/lib/types.ts`
- Change: `docs/SERVER_ACTIONS.md`

**Tests:** Typecheck only; behavior covered in later server tests.

**Status:** Completed

---

### Step 4: Server — sync collaboration_roles on create
**Goal:** Ensure roles are persisted for search when a collaboration is created.

**What we are doing:** After insert, derive roles from `looking_for[]` and insert deduped rows into `collaboration_roles`.

**Technical details:**
- File: `web/lib/server/collabs.ts` → in `createCollab(...)` after tags/logo finalize:
  - Extract roles = `looking_for[].role` → trim, collapse inner whitespace, drop empties; dedupe by lowercase.
  - Bulk insert: `supabase.from('collaboration_roles').insert(roles.map(r => ({ collaboration_id: id, role: r })))`.
  - Wrap in try/catch; non‑fatal on failure, but log.

**Files:**
- Change: `web/lib/server/collabs.ts`

**Tests:** Server test will assert rows exist after create.

**Status:** Completed

---

### Step 5: Server — sync collaboration_roles on update
**Goal:** Keep role index current when roles change.

**What we are doing:** On update with `lookingFor` provided, replace the set in `collaboration_roles` with the new deduped roles.

**Technical details:**
- File: `web/lib/server/collabs.ts` → in `updateCollab(id, fields)`:
  - If `lookingFor` present after validation: `delete from collaboration_roles where collaboration_id = id`; then bulk insert deduped roles.

**Files:**
- Change: `web/lib/server/collabs.ts`

**Tests:** Server test will assert replacement semantics (old rows removed, new rows present).

**Status:** Not Started

---

### Step 6: Server — role search + mode‑aware ranking
**Goal:** Support role text search and distinct ranking for both modes.

**What we are doing:** Enhance `listCollabs` to accept `mode` and `role`, prefetch role matches from `collaboration_roles`, and compute weighted scores per mode.

**Technical details:**
- File: `web/lib/server/collabs.ts` → `listCollabs(params)`:
  - If `params.role` is provided: `select collaboration_id from collaboration_roles where role ilike %needle%` (case‑insensitive), build a Set/Map for roleMatch.
  - Enforce `soft_deleted=false`; and when not `includeClosed`, enforce `is_hiring !== false` for role searches.
  - Ranking for q present:
    - roleMatch (1), titleMatch (2), descMatch (1) booleans.
    - mode==='role': `score = 3*role + 2*title + 1*desc`.
    - mode!=='role': `score = 3*title + 2*desc + 1*role`.
  - Tie‑break: `created_at desc`. Keep cursor pagination.

**Files:**
- Change: `web/lib/server/collabs.ts`

**Tests:** Ranking test fixtures for both modes and `is_hiring` filtering.

**Status:** Not Started

---

### Step 7: API & client — plumb mode/role
**Goal:** Pass `mode`/`role` from UI to server.

**What we are doing:** Allow `/api/collaborations/list` to accept `mode` and `role`, and client wrapper to serialize them.

**Technical details:**
- API route: `web/app/api/collaborations/list/route.ts` → parse `mode`, `role` from query and forward to `listCollabs`.
- Client wrapper: `web/lib/api/collabs.ts` → append `mode` and `role` to `URLSearchParams` when provided.

**Files:**
- Change: `web/app/api/collaborations/list/route.ts`
- Change: `web/lib/api/collabs.ts`

**Tests:** Simple API round‑trip in integration test (ensures params passed through).

**Status:** Not Started

---

### Step 8: Validation — prevent duplicate roles (server)
**Goal:** Enforce clean, non‑duplicated role entries.

**What we are doing:** Add Zod superRefine to block case‑insensitive duplicate roles in `lookingFor[]` with a clear message.

**Technical details:**
- File: `web/app/collaborations/schema.ts` → in `createCollabSchema` and `updateCollabSchema` superRefine:
  - Collect lowercased trimmed role strings; if Set size < list length → add issue at `['lookingFor']` with message “Duplicate roles are not allowed”.

**Files:**
- Change: `web/app/collaborations/schema.ts`

**Tests:** Schema unit test to verify duplicates error and length limit.

**Status:** Not Started

---

### Step 9: /collaborations — server shell → client component
**Goal:** Prepare for interactive modes and URL‑synced filters.

**What we are doing:** Convert page to a server wrapper that passes initial `searchParams` into a new client component.

**Technical details:**
- Page: `web/app/collaborations/page.tsx` → keep server shell, import `CollaborationsClient`.
- Add client: `web/app/collaborations/CollaborationsClient.tsx` ("use client") receiving initial filters (`q`, `mode`, `tech`, `category`, `stages`, `projectTypes`).

**Files:**
- Add: `web/app/collaborations/CollaborationsClient.tsx`
- Change: `web/app/collaborations/page.tsx`

**Tests:** UI smoke (renders with initial props).

**Status:** Not Started

---

### Step 10: Filters + single search box (project mode default)
**Goal:** Implement filters and one search box with URL sync and fetch.

**What we are doing:** Render `FilterBar` (4 facets) and a single search input; wire to `/api/collaborations/list` with `mode='project'` by default.

**Technical details:**
- Component: `CollaborationsClient` maintains state for filters and `q`.
- URL sync via `router.replace` preserving `mode`.
- Fetch with `listCollabs({ mode: 'project', q, techTagIds, categoryTagIds, stages, projectTypes })`.

**Files:**
- Change: `web/app/collaborations/CollaborationsClient.tsx`

**Tests:** UI smoke: filters update and fetch invoked.

**Status:** Not Started

---

### Step 11: Analytics for project mode
**Goal:** Capture search/filter intent and results.

**What we are doing:** Emit `search_performed` and `filter_apply` with `type='collabs'` and `search_mode='project'`.

**Technical details:**
- Use `useAnalytics()` to `track('search_performed', { type: 'collabs', search_mode: 'project', query: q, techTagIds, categoryTagIds, stages, projectTypes, resultCount })`.
- On filter change: `track('filter_apply', {..., search_mode: 'project'})`.

**Files:**
- Change: `web/app/collaborations/CollaborationsClient.tsx`

**Tests:** None (covered by existing analytics mock; manual verification acceptable).

**Status:** Not Started

---

### Step 12: Roles suggestions API
**Goal:** Serve curated role names for suggestions.

**What we are doing:** Add a small API route that returns the alphabetical list from `roles_catalog`.

**Technical details:**
- New route: `web/app/api/roles/list/route.ts` → `select name from roles_catalog order by name asc` (public/anon client).

**Files:**
- Add: `web/app/api/roles/list/route.ts`

**Tests:** None (simple select); exercised by UI.

**Status:** Not Started

---

### Step 13: By role — enable suggestions in the single search box
**Goal:** Provide role suggestions when mode is role.

**What we are doing:** In role mode, the same search box shows a popover dropdown with suggestions from `/api/roles/list`, but still accepts free text.

**Technical details:**
- `CollaborationsClient`: when `mode==='role'`, on focus/typing preload suggestions once, filter client‑side, render a small popover with keyboard navigation (↑/↓/Enter/Escape). On select, set `q` and submit.

**Files:**
- Change: `web/app/collaborations/CollaborationsClient.tsx`

**Tests:** UI smoke (dropdown appears; Enter selects; free text allowed).

**Status:** Not Started

---

### Step 14: By role — split view UI + selection
**Goal:** Implement two‑pane layout and selection workflow.

**What we are doing:** Left shows role results (logo, role, project title); right renders full detail for the selected collaboration. Deep link via `selected=<id>`.

**Technical details:**
- Layout: CSS grid (e.g., `md:grid md:grid-cols-3`, left 1, right 2).
- Left item: use `LogoImage`; display first role (or matched role when available), project title; click sets `selected` in URL and state.
- Right panel: render the same content as `collaborations/[id]` by calling existing server helper via a small API (`/api/collaborations/get?id=...`) or extracting a shared detail component.
- Fetch list with `mode='role'` and `role=q`; hide `is_hiring=false`.

**Files:**
- Change: `web/app/collaborations/CollaborationsClient.tsx`
- Add (optional): `web/app/api/collaborations/get/route.ts` (if using API to fetch one)
- Potentially affected: `web/app/collaborations/[id]/page.tsx` (if extracting a shared detail component)

**Tests:** UI smoke (selection updates panel; deep link restores selection).

**Status:** Not Started

---

### Step 15: Form — headless combobox component
**Goal:** Provide a reusable “creatable” combobox for role entry.

**What we are doing:** Build a headless combobox that shows suggestions and accepts arbitrary text; consistent UX across browsers.

**Technical details:**
- New component: `web/components/ui/combobox-creatable.tsx`
  - Props: `value`, `onChange`, `options: string[]`, `placeholder?`, `maxLength?`.
  - Behavior: input + popover suggestion list; Enter confirms free text; click selects option.
  - Accessibility: keyboard navigation and ARIA roles.

**Files:**
- Add: `web/components/ui/combobox-creatable.tsx`

**Tests:** Component unit test optional; covered via form smoke tests.

**Status:** Not Started

---

### Step 16: Form — replace role input & client‑side duplicate check
**Goal:** Use the combobox in each `lookingFor[]` row and prevent duplicates before submit.

**What we are doing:** Swap the role `Input` with `ComboboxCreatable` and add a client check to block duplicates (disable submit + inline error).

**Technical details:**
- File: `web/app/collaborations/new/page.tsx`
  - Load options from `/api/roles/list` once.
  - For each row, render `ComboboxCreatable`; mirror selection into a hidden `<input name="lf_role" value={row.role} />` for the server action.
  - On change, recompute a Set of lowercased trimmed roles; if duplicate, show error and disable submit.

**Files:**
- Change: `web/app/collaborations/new/page.tsx`

**Tests:** UI smoke (combobox shows suggestions; free text; duplicate disables submit).

**Status:** Not Started

---

### Step 17: Server tests — sync & ranking
**Goal:** Validate role sync and mode‑aware ranking with fixtures.

**What we are doing:** Add tests for creation/update role sync and ranking order for both modes (and `is_hiring` filtering).

**Technical details:**
- New tests:
  - `web/tests/server/collabs.role-sync.test.ts`
  - `web/tests/server/collabs.role-search.test.ts`
- Seed 2–3 collabs; assert `collaboration_roles` rows; assert ranking per mode and exclusion of `is_hiring=false` in role mode.

**Files:**
- Add: `web/tests/server/collabs.role-sync.test.ts`
- Add: `web/tests/server/collabs.role-search.test.ts`

**Tests:** As above.

**Status:** Not Started

---

### Step 18: Schema tests — duplicate role validation
**Goal:** Ensure Zod validation blocks duplicate roles and length overflows.

**What we are doing:** Unit test `createCollabSchema`/`updateCollabSchema` for duplicate detection and max length.

**Technical details:**
- New test: `web/tests/schema/collabs.schema.test.ts`

**Files:**
- Add: `web/tests/schema/collabs.schema.test.ts`

**Tests:** As above.

**Status:** Not Started

---

### Step 19: Analytics + docs + changelog
**Goal:** Finalize instrumentation and documentation.

**What we are doing:** Emit analytics with `search_mode`, update specs and changelog.

**Technical details:**
- Analytics: in `CollaborationsClient`, `track('search_performed' | 'filter_apply', { type: 'collabs', search_mode: mode, query: q, role: mode==='role' ? q : undefined, techTagIds, categoryTagIds, stages, projectTypes, resultCount })`.
- Docs: `docs/MVP_TECH_SPEC.md` (Stage 16), `docs/SERVER_ACTIONS.md` (params & ranking), `supabase/schema.md` (new tables), `CHANGELOG.md` (Unreleased).

**Files:**
- Change: `web/app/collaborations/CollaborationsClient.tsx` (analytics calls)
- Change: `docs/MVP_TECH_SPEC.md`
- Change: `docs/SERVER_ACTIONS.md`
- Change: `supabase/schema.md`
- Change: `CHANGELOG.md`

**Tests:** Manual verification for analytics events; docs review.

**Status:** Not Started

--- 

## Acceptance Criteria

- UI
  - `/collaborations` has two modes: By project (default) and By role, toggled in‑page.
  - One search box in both modes; in role mode, shows suggestions from `roles_catalog` while allowing free text.
  - By role shows split view (left list with logo, role, project title; right detail identical to `collaborations/[id]`).
  - Filters limited to technology, category, stages, and projectTypes; “Clear All” resets those facets.
  - Role results do not show posts with `is_hiring=false`.
- Behavior
  - Ranking: role>title>description in role mode; title>description>role in project mode; tie‑break by `created_at desc`.
  - Collaboration form uses a headless “creatable” combobox for each role; duplicate roles (case‑insensitive) are prevented client + server side.
  - `collaboration_roles` reflects deduped `looking_for[].role` on create/update.
  - API accepts and plumbs `mode` and `role`; `/search` can later reuse without code changes.
- Analytics
  - `search_performed` and `filter_apply` include `type='collabs'`, `search_mode`, `role?`, and facet arrays.
- Quality
  - Tests pass (server sync/ranking, schema duplicates, UI smoke). No linter/type errors.


## Workflow

At each step in 'Actionable and specific steps':

- Explain clearly what we are doing and why (layman’s terms), add technical details when terms are used.
- Inspect relevant code, documents, and `.cursorrules` before making changes.
- Implement minimal, robust, reusable code; identify all affected files to prevent regressions.
- Add/adjust tests; ensure all tests pass.
- Guide user to review code/UI; after approval, update progress tracking and docs.
- AFTER user's approval, commit with Conventional Commits and push. ONLY then proceed to the next step.

If you need help from user, give clear instructions to user on how to do it or what needs to be decided on.


## Progress Tracking

| Step | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| 1. DB: trgm + collaboration_roles | Completed | 23/9/2025 | 23/9/2025 | Migration 20250923163755 added |
| 2. DB: roles_catalog + seed | Completed | 23/9/2025 | 23/9/2025 | Migration 20250923164504 added |
| 3. Contracts & types | Completed | 23/9/2025 | 23/9/2025 | types.ts + SERVER_ACTIONS.md updated |
| 4. Server: sync on create | Completed | 23/9/2025 | 23/9/2025 | roles synced to collaboration_roles on create |
| 5. Server: sync on update | Not Started | — | — |  |
| 6. Server: list + ranking | Not Started | — | — |  |
| 7. API & client plumb | Not Started | — | — |  |
| 8. Validation: duplicate roles | Not Started | — | — |  |
| 9. /collaborations shell | Not Started | — | — |  |
| 10. Filters + single search | Not Started | — | — |  |
| 11. Analytics (project mode) | Not Started | — | — |  |
| 12. Roles suggestions API | Not Started | — | — |  |
| 13. Role suggestions in search | Not Started | — | — |  |
| 14. Split view UI | Not Started | — | — |  |
| 15. Headless combobox | Not Started | — | — |  |
| 16. Form replace + dedupe check | Not Started | — | — |  |
| 17. Tests: server sync & ranking | Not Started | — | — |  |
| 18. Tests: schema | Not Started | — | — |  |
| 19. Analytics + docs + changelog | Not Started | — | — |  |


## Risk Mitigation

**Search correctness:**
- Normalize/dedupe roles before inserting to `collaboration_roles`; enforce unique index `(collaboration_id, lower(role))`.
- Join against `collaborations` to filter out `is_hiring=false` in role mode.

**Performance:**
- Trigram GIN index on `lower(role)`; limit result window; paginate with existing cursor scheme.

**UX consistency:**
- One search box across modes; only suggestions differ. Headless combobox ensures consistent look/feel vs native datalist.

**Data drift:**
- Replace‑set sync on update keeps `collaboration_roles` accurate.

**Security & RLS:**
- Reads use anon client; writes under authenticated session with existing RLS; no service role exposed to client.

**Rollback plan:**
- Feature flagged by `mode` parameter; the default “By project” remains functional if role mode encounters issues.

---

**Last Updated:** 23/9/2025  
**Next Review:** After Step 7 (API plumb), before UI steps


