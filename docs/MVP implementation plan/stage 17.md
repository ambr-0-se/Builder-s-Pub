# Stage 17 Implementation Plan: Collaboration visibility (auth-only)

**Status:** Planned  
**Started:** 24/9/2025
**Completed:** —

## Overview

Gate collaboration browsing and detail pages behind authentication. Anonymous users should not be able to view collaboration lists or individual collaboration details. Hide collaboration entry points in the UI when not signed in. Enforce database-level protections so anonymous sessions cannot select collaboration data. Keep the projects area fully public.

## Tasks

### 1. Database & RLS
Require authentication for `select` on collaboration-related tables (core rows, tags join, upvotes, comments, roles index). Keep `roles_catalog` public read.

### 2. Server Logic (Auth-only reads)
Switch collaboration read helpers to use authenticated server client and require a valid session before fetching.

### 3. Route Gating (App Router)
Gate `/collaborations` and `/collaborations/[id]` with a server-side auth check; redirect to sign-in with `redirectTo` when anonymous.

### 4. API Gating
Require auth for `/api/collaborations/list` and `/api/collaborations/get` (401 on anon).

### 5. UI Visibility
Hide collaboration links/CTAs in navbar/footer/landing/search for anonymous users; avoid server fetching of collaboration data for anon.

### 6. SEO & Sitemap
Remove collaboration URLs from the sitemap since pages are auth-only; update tests accordingly.

### 7. Tests & Docs
Add/adjust tests for RLS, redirects, API 401s, and UI visibility. Update docs and changelog.


## Actionable and Specific Steps

### Step 1: DB & RLS — require auth for collaboration reads
**Goal:** Prevent anonymous users from reading collaboration data at the database layer.

**What we are doing:** Update RLS policies so `select` is allowed only when an authenticated user exists for collaboration-related tables. This ensures data access is blocked even if an API route is misconfigured.

**Technical details:**
- Create a new migration (timestamped) to update RLS policies for the following tables:
  - `collaborations`: change `select` policy to require `auth.uid() is not null` AND `soft_deleted=false`.
  - `collaboration_tags`: change `select` policy to require `auth.uid() is not null`.
  - `collaboration_upvotes`: change `select` policy to require `auth.uid() is not null`.
  - `collab_comments`: change `select` policy to require `auth.uid() is not null` AND `soft_deleted=false`.
  - `collaboration_roles`: change `select` policy to require `auth.uid() is not null`.
  - Keep `roles_catalog` public select.
- Update `supabase/rls_policies.sql` accordingly to be the canonical policy source.

**Files:**
- Add: `supabase/migrations/20250923180000_collaborations_auth_only_select.sql` (run the command `TZ=Asia/Hong_Kong date +%Y%m%d%H%M%S` to get current time)
- Change: `supabase/rls_policies.sql`
- Change: `supabase/schema.md` (RLS Summary)
- Potentially affected: `web/lib/server/collabs.ts` (reads will now require auth)
- Potentially affected: tests that assumed public read of collaborations

**Tests:** Add server integration tests to assert anon select is denied (expect errors/empty) and authed select succeeds.

**Status:** Not Started

---

### Step 2: Server — use authenticated client and require session in list/get
**Goal:** Ensure collaboration reads occur only under an authenticated session.

**What we are doing:** Replace anonymous server client usage with the authenticated server client (`getServerSupabase()`) in `listCollabs`/`getCollab`. If there is no session, return an error (or let callers handle 401) instead of attempting a read.

**Technical details:**
- File: `web/lib/server/collabs.ts`
  - At start of `listCollabs(params)`, call `getServerSupabase().auth.getUser()`; if no `user`, throw/return `{ items: [] }` with an auth error signal or raise an error consumed by callers.
  - Replace `getAnonServerClient()` queries with the server client instance; maintain existing filtering/ranking logic.
  - Same for `getCollab(id)`: require session before fetching; return `null` or throw on anon.
  - Keep best-effort fallbacks for missing columns per existing pattern.

**Files:**
- Change: `web/lib/server/collabs.ts`
- Potentially affected: `web/app/page.tsx`, `web/app/search/page.tsx` (they may use server helpers directly)

**Tests:** Update/extend server tests to expect 401/guard behavior on anon when invoking API wrappers; verify authed path still returns data.

**Status:** Not Started

---

### Step 3: API routes — enforce auth (401 when anon)
**Goal:** Protect collaboration API endpoints from anonymous access.

**What we are doing:** Add a server-side auth check in the API routes. If the request is unauthenticated, return `401 { error: 'unauthorized' }`.

**Technical details:**
- File: `web/app/api/collaborations/list/route.ts`
  - Use `getServerSupabase()`; if no `auth.user`, return `NextResponse.json({ error: 'unauthorized' }, { status: 401 })`.
  - Otherwise, forward to `listCollabs(params)`.
- File: `web/app/api/collaborations/get/route.ts`
  - Same pattern: require `auth.user` before calling `getCollab(id)`.

**Files:**
- Change: `web/app/api/collaborations/list/route.ts`
- Change: `web/app/api/collaborations/get/route.ts`

**Tests:** Add `web/tests/collabs.api.auth.test.ts` asserting 401 when anon for both endpoints.

**Status:** Not Started

---

### Step 4: Route gating — `/collaborations` and `/collaborations/[id]`
**Goal:** Redirect anonymous users to sign-in when they attempt to access collaboration pages.

**What we are doing:** Add server-side auth checks to both pages and redirect anonymous sessions to `/auth/sign-in?redirectTo=<original>`.

**Technical details:**
- File: `web/app/collaborations/page.tsx`
  - At the top-level server component, get session via `getServerSupabase()`; if no user, `redirect('/auth/sign-in?redirectTo=/collaborations')`.
- File: `web/app/collaborations/[id]/page.tsx`
  - Do the same auth check before calling `getCollab(id)` (to avoid RLS failures and to keep flow consistent); `redirect('/auth/sign-in?redirectTo=/collaborations/<id>')`.
- Optional: introduce a small `LoginRequired` server component for reusability (but keep changes minimal for now).

**Files:**
- Change: `web/app/collaborations/page.tsx`
- Change: `web/app/collaborations/[id]/page.tsx`
- Potentially affected: `web/app/collaborations/CollaborationsClient.tsx` (no change expected; runs after server guard)

**Tests:** Add route tests verifying redirects for anon; ensure authed sessions render content.

**Status:** Not Started

---

### Step 5: UI visibility — navbar, footer, and CTAs
**Goal:** Avoid showing collaboration entry points to anonymous users.

**What we are doing:** Conditionally render collaboration links/CTAs based on auth state. On click while anon, direct to sign-in instead of the private page.

**Technical details:**
- File: `web/components/layout/navbar.tsx`
  - Hide the `Collaborations` link when `!isAuthenticated`.
- File: `web/components/layout/footer.tsx`
  - Hide `Collaborations`/`Post Collaboration` links for anonymous users.
- File: `web/app/profile/page.tsx`
  - Ensure `Post Collaboration` remains visible only for authed user contexts (already gated by profile route).

**Files:**
- Change: `web/components/layout/navbar.tsx`
- Change: `web/components/layout/footer.tsx`
- Potentially affected: `web/app/page.tsx`, `web/app/search/page.tsx`

**Tests:** Add a client-render test that, when `useAuth().isAuthenticated=false`, nav/footer do not show collaboration links/CTAs.

**Status:** Not Started

---

### Step 6: Landing page — avoid fetching and hide previews for anon
**Goal:** Prevent unnecessary collaboration queries and show a clear sign-in CTA on the landing page when anonymous.

**What we are doing:** If no session on the server, do not call `listCollabs` for the homepage. Replace collaboration preview section with a small card prompting sign-in.

**Technical details:**
- File: `web/app/page.tsx`
  - Use `getServerSupabase()`; when `!auth.user`, skip `listCollabs` calls; render a compact “Sign in to browse collaborators” card. Replace `Find Collaborators` and `View All` CTAs with a link to `/auth/sign-in?redirectTo=/collaborations`.

**Files:**
- Change: `web/app/page.tsx`

**Tests:** Add a server-render test snapshot for anon showing the sign-in prompt instead of collab previews.

**Status:** Not Started

---

### Step 7: Search page — hide collab results or show login-required state
**Goal:** Keep search UX predictable; do not attempt collab fetches for anon.

**What we are doing:** When anonymous, hide the collaborations tab/section or show a login-required notice instead of attempting API calls that will return 401.

**Technical details:**
- File: `web/app/search/page.tsx`
  - On server, check session; if anon, do not call `listRealCollabs`; conditionally render a login-required card for the collaborations section/tab.
  - If the page currently renders a unified view, guard the collab half only.

**Files:**
- Change: `web/app/search/page.tsx`

**Tests:** Add a render test verifying no collab fetch for anon and that a login-required message is shown.

**Status:** Not Started

---

### Step 8: Sitemap — remove collaboration URLs
**Goal:** Ensure sitemap does not include private routes.

**What we are doing:** Remove `/collaborations` and `/collaborations/[id]` URLs from `sitemap.xml` generation and update the test expectations.

**Technical details:**
- File: `web/app/sitemap.xml/route.ts`
  - Remove `{ loc: `${base}/collaborations` }` and per-collaboration URLs. Keep projects and public pages.
- File: `web/tests/sitemap.test.ts`
  - Update assertions to no longer expect collab URLs.

**Files:**
- Change: `web/app/sitemap.xml/route.ts`
- Change: `web/tests/sitemap.test.ts`

**Tests:** Adjust existing sitemap test to ensure collab URLs are absent.

**Status:** Not Started

---

### Step 9: Tests — RLS, redirects, API 401s, and UI visibility
**Goal:** Validate end-to-end protections and UX for anonymous vs authenticated users.

**What we are doing:** Add/adjust tests across layers to reflect auth-only behavior for collaborations.

**Technical details:**
- New tests:
  - `web/tests/collabs.api.auth.test.ts` → 401 on anon for list/get.
  - `web/tests/routes.collaborations.redirect.test.tsx` → pages redirect to sign-in when anon.
  - `web/tests/navbar.auth-visibility.test.tsx` → nav/footer hide collaboration links on anon.
  - Update existing tests that relied on public collab data or sitemap.

**Files:**
- Add: `web/tests/collabs.api.auth.test.ts`
- Add: `web/tests/routes.collaborations.redirect.test.tsx`
- Add: `web/tests/navbar.auth-visibility.test.tsx`
- Change: `web/tests/sitemap.test.ts`

**Tests:** As above; ensure green locally.

**Status:** Not Started

---

### Step 10: Docs & changelog
**Goal:** Document the auth-only collaboration policy and update specs.

**What we are doing:** Update the MVP tech spec, server actions contracts, and schema RLS overview. Add a user-visible note to the changelog.

**Technical details:**
- Docs:
  - `docs/MVP_TECH_SPEC.md` → Stage 17 moved from Planned to In Progress/Completed with details.
  - `docs/SERVER_ACTIONS.md` → `listCollabs`/`getCollab` require auth; API routes return 401 when anon.
  - `docs/AUTH.md` → note collaboration pages are auth-only; sign-in redirects preserved.
  - `supabase/schema.md` → RLS summary updated to reflect auth-only selects for collaboration tables.
  - `CHANGELOG.md` → add Unreleased bullet for this behavior change.

**Files:**
- Change: `docs/MVP_TECH_SPEC.md`
- Change: `docs/SERVER_ACTIONS.md`
- Change: `docs/AUTH.md`
- Change: `supabase/schema.md`
- Change: `CHANGELOG.md`

**Tests:** Docs lint/review only.

**Status:** Not Started

---

### Step 11: Quality gate — lint/build/tests
**Goal:** Ensure a green state after changes.

**What we are doing:** Run `pnpm install --frozen-lockfile` (if needed), then `pnpm lint`, `pnpm build`, and `pnpm test`. Fix any issues until green.

**Technical details:**
- Use pnpm via Corepack, as per repository rules.

**Files:**
- Potentially affected: Various (fixes only)

**Tests:** CI/local runs should be fully green.

**Status:** Not Started

--- 

## Acceptance Criteria

- Auth-only access
  - Anonymous users cannot access `/collaborations` or `/collaborations/[id]` (redirected to sign-in with `redirectTo`).
  - API routes `/api/collaborations/list` and `/api/collaborations/get` return 401 for anonymous requests.
  - Database RLS denies `select` on collaboration tables for anon sessions.
- UI behavior
  - Navbar/footer do not show collaboration links for anonymous users.
  - Landing page does not fetch or render collaboration previews for anonymous users; shows a clear sign-in CTA.
  - Search page does not fetch collaboration results when anonymous and shows a login-required state for that section.
- SEO
  - Sitemap excludes `/collaborations` and any `/collaborations/[id]` URLs.
- Quality
  - Tests updated/added and passing (RLS denial, redirects, API 401, UI visibility, sitemap adjustments).
  - Lint and type checks pass; build is green.


## Workflow

At each step in 'Actionable and specific steps':

- Explain clearly what we are doing and why (layman’s terms), add technical details when terms are used.
- Inspect relevant code, documents, and `.cursorrules` before making changes.
- Implement minimal, robust, reusable code; identify all affected files to prevent regressions.
- Add/adjust tests; ensure all tests pass and build is green.
- Guide user to review code/UI; after approval, update progress tracking and docs.
- AFTER user's approval, commit with Conventional Commits and push. ONLY then proceed to the next step.

If you need help from user, give clear instructions to user on how to do it or what needs to be decided on.


## Progress Tracking

| Step | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| 1. DB & RLS | Not Started | — | — |  |
| 2. Server: list/get require session | Not Started | — | — |  |
| 3. API routes auth | Not Started | — | — |  |
| 4. Route gating (pages) | Not Started | — | — |  |
| 5. UI visibility (nav/footer/CTAs) | Not Started | — | — |  |
| 6. Landing page gating | Not Started | — | — |  |
| 7. Search page gating | Not Started | — | — |  |
| 8. Sitemap changes | Not Started | — | — |  |
| 9. Tests (auth-only behavior) | Not Started | — | — |  |
| 10. Docs & changelog | Not Started | — | — |  |
| 11. Quality gate | Not Started | — | — |  |

## Risk Mitigation

**Redirect loops:**
- Ensure sign-in page does not bounce back to a gated route until session is established; only include `redirectTo` to the original path.

**Caching & 401s:**
- Mark collaboration API responses as `no-store` and ensure client wrappers do not cache 401s. Client code should not auto-retry when anon.

**RLS rollout:**
- Apply RLS changes and verify with tests before switching server helpers to authed clients. Keep fallbacks for missing columns as already implemented.

**SEO impact:**
- Removing collab URLs from the sitemap is expected; projects remain public. Add a brief note in the changelog explaining the change.

**UX clarity:**
- Show clear sign-in prompts where content is hidden; avoid dead links.

---

**Last Updated:** 24/9/2025  
**Next Review:** After Step 4 (route gating) before UI adjustments


