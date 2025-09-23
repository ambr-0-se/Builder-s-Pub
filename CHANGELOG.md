# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog (https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning (https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Stage 16: Collaborations — unified search box and reusable FilterBar on `/collaborations` (project mode). Client shell in place to enable role mode split view next.
- Stage 16: Analytics — `/collaborations` emits `search_performed` and `filter_apply` with `search_mode='project'` and unified tag/stage/type properties.
- Stage 16: Roles suggestions API — `GET /api/roles/list` returns alphabetized role names from curated catalog.
- Stage 16: Role-mode suggestions — `/collaborations?mode=role` search box shows curated suggestions with keyboard selection.
 - Stage 16: Role split view — in-page mode toggle; left list + right detail panel; selected deep-link via `selected=<id>`; matched role highlighting; ranking fallback scans `looking_for[]`.
 - Stage 16: UX — compact segmented mode toggle placed inline with the search; role suggestions dropdown can be closed by pressing Escape, clicking outside, or using a "Hide" button.
- Stage 15 (Logos & Avatars):
  - Public-read buckets: `project-logos`, `collab-logos`, `profile-avatars`; DB columns `projects.logo_path`, `collaborations.logo_path`, `profiles.avatar_path`.
  - Server actions: request/set/clear logo for projects and collaborations; request-new upload for create forms; `logoUrl` mapping via public URL.
  - UI: reusable `LogoImage` with monogram gradient fallback; create-form dropzone (auto-upload, inline × to clear); owner-only overlay “Change” with headless picker, optimistic preview, always-visible spinner.
  - Finalization: move-on-submit from `*/new/<userId>/…` to `<entityId>/…` on create/set; cache-busting on success.
  - Ops: GitHub Actions daily cleanup of stale temp uploads (`.github/workflows/cleanup-new-uploads.yml`); scripts `web/scripts/cleanup-new-uploads.ts` and `web/scripts/finalize-new-logos.ts` (with dry-run).
  - Profile avatars (Step 6a): owner-only overlay on `/profile` header (size 96, rounded full) using profile avatar actions; “Remove Avatar” exposed only on `/profile`.
- Stage 14: Tag curation & validation
  - Case-insensitive uniqueness for tags at DB: `unique(type, lower(name))`.
  - Admin tag normalization (trim/collapse whitespace) with friendly duplicate warnings.
  - Combobox tag picker with quick‑pick chips; per-facet caps (Tech ≤ 5, Category ≤ 3).
  - Curated initial tag set seeded idempotently; sources cited in `docs/MVP_TECH_SPEC.md` and CSV at `docs/tags/curated-tags.csv`.
  - Defaults: quick-picks updated (Tech: Agents, LLM, Speech, Vibe Coding, Fine-tuning; Category: Productivity, Education/ Study tools, Content/Media, Research). “Others” is always sorted last in dropdown.
- Global error pages (`web/app/error.tsx`, `web/app/not-found.tsx`) with friendly actions.
- Error report API (`POST /api/errors/report`) with PII redaction, anonymized user id, rate limiting, and breadcrumbs.
- Client error reporter (global listeners) with throttling and a 30-cap breadcrumbs ring buffer (routes/clicks).
- External link disclaimer modal (one-time per browser) with localStorage persistence; utilities and tests included.
- `/report-problem` page and server action leveraging the same report pipeline.
- Analytics events for external link disclaimer interactions.
### Added
- Stage 12: Analytics
  - PostHog-ready analytics wrapper: `AnalyticsProvider` + `useAnalytics()` with safe no‑op when disabled; hardened `trackServer()`.
  - Canonical event names and normalization from legacy names (e.g., `project_created`→`project_create`, `filters_applied`→`filter_apply`).
  - Instrumented events: `signup`, `profile_update`, `project_create`, debounced `project_view`, `search_performed`, `filter_apply` (unified schema with `type` and `*TagIds`, plus `stages`/`projectTypes` for collabs), `comment_added`/`comment_deleted`/`reply_added`, `upvote_toggled`, `collab_comment_added`/`collab_comment_deleted`.
  - Tests: analytics wrapper unit tests and server action emission tests for projects and collaborations.
  - Docs updated: `docs/ANALYTICS.md` (configuration & verification) and `ops/ENVIRONMENT.md` (local verification guide). Stage 12 plan updated.
### Added
- Stage 11: Rate Limits (Aligned Strategy)
  - Daily limits for content creation: Projects and Collaborations ≤ 5/day/user.
  - Engagement limits maintained: Comments/Replies ≤ 5/min/user; Upvote toggles ≤ 10/min/user.
  - Shared server-side rate limiting utility consolidates logic (`web/lib/server/rate-limiting.ts`).
  - UI: clear error toasts for daily limits on creation forms with retry hints.
  - Tests added for project/collaboration creation limits and utility behavior.
  - Docs updated: `docs/MVP_TECH_SPEC.md`, `docs/SERVER_ACTIONS.md`, Stage 11 plan.

### Added
- Stage 10: Demo Embed + SEO
  - Inline demo embedding (YouTube, Vercel) with sandbox + allowlist and graceful fallback.
  - Project detail SEO metadata (OpenGraph + Twitter).
  - Core page metadata for /projects, /collaborations, /search.
  - Dynamic sitemap.xml with recent items.
  - Tests for embed utils, metadata, and sitemap route.
- Search (Stage 9):
  - Unified `/search` for Projects and Collaborations with keyword (`q`) and filter chips.
  - Projects: ranking title > tagline > description; cursor pagination; API accepts `q` and `cursor`.
  - Collaborations: filters `techTagIds`, `categoryTagIds`, `stages[]`, `projectTypes[]`; “All” chips equal no filter; cursor pagination.
  - New API: `/api/collaborations/list` with `q`, `stages`, `projectTypes`, tags, `cursor`.
  - Docs updated: `docs/SERVER_ACTIONS.md`, `docs/MVP_TECH_SPEC.md`.

### Added
- Collaboration Board (Stage 8):
  - Real CRUD with RLS; new fields (affiliated org, project types[], stage, looking_for with amount, contact, remarks, is_hiring).
  - Pages: `/collaborations/new`, `/collaborations`, `/collaborations/[id]` with upvotes and threaded comments.
  - Owner-only “Hiring/No longer hiring” toggle with optimistic UI; list hides closed by default.
  - Project type chips; form re-ordered; Title ≤160.
  - Docs updated: `docs/MVP_TECH_SPEC.md`, `docs/SERVER_ACTIONS.md`, `supabase/schema.md`.

### Added
- Stage 6 complete: comments with replies, upvotes (project/comment), optimistic UI, rate limits, and analytics events. Docs updated.


### Added
- Comments (Stage 6) groundwork: validation schema and server functions
  - Added `commentSchema` (1–1000 chars) and types
  - Implemented server functions: `addComment`, `deleteComment`, and included `comments[]` in `getProject`
  - Files: `web/app/projects/schema.ts`, `web/lib/server/projects.ts`, `docs/MVP_TECH_SPEC.md`

- Comment threads and upvotes (partial)
  - DB: `parent_comment_id` on `comments`, `comment_upvotes`, related indexes and RLS; simple `rate_limits` table
  - Server: threaded fetch (1-level replies), `addReply`, `toggleCommentUpvote`, `toggleProjectUpvote`
  - UI: generic `UpvoteButton` for project/comment; fixed transition warning
  - Files: `supabase/migrations/20250822180000_add_comment_replies_upvotes.sql`, `supabase/rls_policies.sql`, `supabase/schema.md`, `web/lib/server/projects.ts`, `web/app/projects/actions.ts`, `web/components/features/projects/upvote-button.tsx`, `docs/SERVER_ACTIONS.md`

- Upvote state persistence for projects and comments
  - Server-side `hasUserUpvoted` flag now correctly reflects user's upvote state after page reload
  - Implemented `fetchUserProjectUpvotes()` and `fetchUserCommentUpvotes()` helper functions
  - Upvote buttons maintain visual state (filled/outline) across page refreshes
  - Files: `web/lib/server/projects.ts`, `docs/SERVER_ACTIONS.md`, `docs/MVP_TECH_SPEC.md`

### Changed
- Upvotes UI consistency (Stage 7): Landing (Featured + Trending) and `/projects` now reuse the non-interactive `UpvoteButton`; if the signed-in user previously upvoted a project, the button appears darkened. API route `/api/projects/list` augments responses with `hasUserUpvoted` for authenticated users.
- Admin access: server now validates admin email via Supabase server session instead of parsing cookies/JWTs. Adds `/debug-admin` diagnostics page.
  - Files: `web/lib/server/admin.ts`, `web/app/debug-admin/page.tsx`, docs updated (`docs/ARCHITECTURE.md`, `docs/AUTH.md`).
- Rate limits added for comments and upvotes
  - Comments/replies: 5/min per user; Upvote toggles: 10/min per user
  - Friendly UI messages include cooldown seconds when available
  - Files: `web/lib/server/projects.ts`, `web/app/projects/actions.ts`, `web/components/features/projects/comment-form.tsx`, `web/components/features/projects/upvote-button.tsx`, `docs/SERVER_ACTIONS.md`, `docs/MVP_TECH_SPEC.md`

### Changed
- Development: Standardized package manager to pnpm and added Corepack setup
  - Enforced via `web/package.json` preinstall guard
  - Docs updated: `ops/ENVIRONMENT.md`, `web/README.md`, `docs/MVP_TECH_SPEC.md`, `web/SPECIFICATION.md`

### Fixed
- Auth/session: Prevent unauthorized server actions after dev restart by syncing server cookies
  - Added `ensureServerSession()` and invoked on `/projects/new`
  - Files: `web/lib/api/auth.ts`, `web/app/projects/new/page.tsx`

- Comments: prevent server error before migration applied
  - `getProject()` falls back to flat comments when threaded columns are missing
  - Files: `web/lib/server/projects.ts`

- Toast System: Fixed duplicate success toasts after project creation
  - Implemented sessionStorage-based deduplication with per-project unique keys
  - Added useRef guard in CreatedToastOnce component to prevent multiple executions
  - Files: web/lib/created-flag.ts, web/app/projects/[id]/created-toast.tsx, web/tests/created-flag.test.ts

- Next.js 15 Compatibility: Fixed async params requirement in dynamic routes
  - Updated project detail page to use await params
  - Files: web/app/projects/[id]/page.tsx

- Development Environment: Fixed build manifest corruption causing internal server errors
  - Created reset script for handling Next.js cache corruption issues
  - Files: web/scripts/reset-dev.sh

### Added
- Development Tools: Added scripts/reset-dev.sh for robust development environment recovery

### Changed
- Form Submission: Simplified project creation form submission flow
  - Removed client-side success handling from new project page
  - Success feedback handled exclusively on detail page after redirect
  - Files: web/app/projects/new/page.tsx, web/app/projects/actions.ts

