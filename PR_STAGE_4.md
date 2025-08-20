# Stage 4 — Tags from DB & Admin Tag Management

Merge `feat/stage-4-tags-from-db` into `main`

## Summary
Implements Stage 4 of the MVP: loads Technology/Category tags from the database (replacing hardcoded constants), adds an admin-only tag management page, and wires tags across Filters, Search, New Project, and Home. Includes RLS for public reads, server actions for admin writes, tests, and documentation updates. Fixes a landing page auth error by using an anonymous client for public reads.

## Context
- PRD: Reviewer/tag-driven discovery is central to the product
- MVP Tech Spec: Stage 4 — Tags from DB (governance)
- Governance: controlled vocabulary in `tags (name, type)` with unique constraint `(name, type)`; users select existing; admin-only creation in MVP

## Scope of Changes
- Replace tag constants with DB-backed fetching across the app
- Admin UI to create tags (technology/category) with duplicate guard and live suggestions
- Anonymous client for public tag reads on the landing page to avoid auth errors
- Server action returns created tag for optimistic UI update
- Docs + tests updated

## User-Facing Changes
- Filters (Projects, Search) and New Project form now render tags from DB
- Home page “Get Inspired” tags load from DB
- Admins see an “Admin” link in Navbar and can manage tags at `/admin/tags`

## Implementation Details
### Data & Security
- `supabase/rls_policies.sql`: enable RLS on `tags`; allow public SELECT
- Reads: anonymous/anon-key clients (public)
- Writes: server actions with service role only (server-only), guarded by `isAdmin()` using `ADMIN_EMAILS`

### Server Actions
- `createTag(formData: { name, type })` → `{ success, tag } | { fieldErrors?, formError? }`
  - Admin-only; returns the inserted tag (`id,name,type`) and revalidates `/`, `/projects`, `/search`, `/admin/tags`

### Admin UI
- `/admin` dashboard with links (currently: Manage Tags)
- `/admin/tags` manager:
  - Lists existing Technology and Category tags
  - Two add bars (one per type)
  - Live suggestions for substring matches
  - Add button disabled only on exact (case-insensitive) duplicate
  - No delete for this stage (intentionally omitted)

### Fixes
- Home page: replaced server auth client with anonymous client for tag fetching (public read), preventing `Invalid Refresh Token` errors

## Files Touched (high level)
- UI/Pages:
  - `web/app/page.tsx` (Home)
  - `web/app/projects/new/page.tsx` (New Project)
  - `web/app/search/page.tsx` (Search)
  - `web/components/features/projects/filter-bar.tsx` (Filters)
  - `web/app/admin/page.tsx` (Admin)
  - `web/app/admin/tags/page.tsx`, `web/app/admin/tags/tag-manager.tsx` (Admin Tags)
  - `web/components/layout/navbar.tsx`, `web/app/layout.tsx` (Admin link)
- Data/API:
  - `web/lib/api/tags.ts`, `web/hooks/useTags.ts` (client)
  - `web/lib/server/tags.ts` (server-side fetch via anonymous client)
  - `web/lib/supabaseService.ts` (service role client util)
  - `web/lib/server/admin.ts` (admin allowlist)
- RLS/Docs:
  - `supabase/rls_policies.sql` (tags select)
  - `docs/SERVER_ACTIONS.md`, `docs/ARCHITECTURE.md`, `web/README.md`, `docs/MVP_TECH_SPEC.md`
- Tests:
  - `web/tests/tags.api.test.ts`, `web/tests/tags.validation.test.ts`, `web/tests/tags.integration.test.ts`

## Environment
- `ADMIN_EMAILS` (comma-separated admin emails)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; DO NOT expose to client)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Test Plan
- Automated: 20 tests passing (API, validation, integration, profile)
- Manual (see `STAGE4_TEST_PLAN.md`):
  - Filters/Search/Project form use DB tags
  - Admin creates a tag and sees it appear across UI
  - Duplicate guard blocks exact duplicates; suggestions show substring matches
  - Landing page loads without auth errors

## Backwards Compatibility
- Removed `web/constants/tags.ts`; all references migrated to DB-backed sources
- Mock projects updated to inline tag objects for demo content

## Risks & Mitigations
- Tag deletes (not implemented): out of scope; prevents accidental cascade on `project_tags`
- Service role usage: confined to server-only utilities; guarded by email allowlist; documented in Ops

## Checklist
- [x] RLS policies applied for `tags` (public select)
- [x] Admin-only creation via server actions + service role
- [x] DB tags wired across UI (Filters, Search, New Project, Home)
- [x] Tests updated and passing
- [x] Docs updated (Server Actions, Architecture, MVP Tech Spec, Environment)
- [x] No secrets exposed to client

---

Closes: Stage 4 of MVP (Tags from DB + Admin tag management)
