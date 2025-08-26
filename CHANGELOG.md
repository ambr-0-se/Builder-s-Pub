# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog (https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning (https://semver.org/spec/v2.0.0.html).

## [Unreleased]
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

