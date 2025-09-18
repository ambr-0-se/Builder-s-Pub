# Stage 15 Implementation Plan: Logos for Projects & Collaborations + Profile Avatars

**Status:** Planned  
**Started:** 18/9/2025
**Completed:** —

## Overview

Stage 15 delivers image identity across the platform:
- Project and Collaboration logos: secure upload (≤1MB PNG/JPEG/SVG), public-read storage, owner-only management, rendering in lists and detail with graceful fallbacks.
- Profile avatars: optional upload/edit on profile page with the same security/size/mime constraints and rendering across the app.

This improves recognizability and scannability while keeping changes minimal, robust, and aligned with RLS and server-action patterns.

## Tasks

### 1. Database & Storage
Add `logo_path` to `projects` and `collaborations`; add `avatar_path` to `profiles`. Create public-read storage buckets: `project-logos`, `collab-logos`, `profile-avatars`.

### 2. Server Modules & Actions
Add request/set logo/avatar server functions using signed upload URLs; extend list/detail selectors to include paths; enforce owner/self checks.

### 3. UI Upload Components
Create a reusable `LogoUploader` (also used for avatar) with preview, size/mime validation, and a two-step upload (request URL → PUT → set path). Surface upload controls on detail pages (owner-only). Add “Optional: Upload your logo” at the bottom of create forms.

### 4. Rendering
Render logos/avatars across cards, lists, and detail pages with `next/image` (unoptimized true), with placeholder fallback.

### 5. Tests & Docs
Add server tests (authorization, path, size/mime), component tests (fallback rendering), and update docs/specs/CHANGELOG.


## Actionable and Specific Steps

### Step 1: Add DB columns and storage buckets
**Goal:** Persist image paths and enable storage locations for uploads.

**What we are doing:** We’ll add text columns to store file paths for logos/avatars, and create three storage buckets with public read so images can render on public pages.

**Technical details:**
- Columns:
  - `projects.logo_path text null`
  - `collaborations.logo_path text null`
  - `profiles.avatar_path text null`
- Buckets: `project-logos`, `collab-logos`, `profile-avatars` (public: true). We’ll rely on signed upload URLs and keep read public for performance.
- Keep RLS as-is (paths stored in tables already protected by RLS for write operations). Storage write occurs via signed URLs; no service key to client.

**Files:**
- Add: `supabase/migrations/20250918000100_stage15_logos_avatars.sql`
- Change: `supabase/schema.md` (document new columns/buckets)
- Potentially affected: `supabase/rls_policies.sql` (review; no changes expected)

**Tests:**
- Migration loads without errors in local Supabase.

**Status:** Not Started

---

### Step 2: Extend types and server DTOs
**Goal:** Expose `logoPath`/`avatarPath` to UI.

**What we are doing:** Update TypeScript types and server mappers so list/detail endpoints include optional path fields.

**Technical details:**
- Extend `Project`, `ProjectWithRelations`, collab shapes, and `Profile` with `logoPath?/avatarPath?`.
- Update selectors in server modules to include `logo_path`/`avatar_path` and map to camelCase.

**Files:**
- Change: `web/lib/types.ts`
- Change: `web/lib/server/projects.ts` (select `logo_path`, map to `logoPath`)
- Change: `web/lib/server/collabs.ts` (select `logo_path`, map to `logoPath`)
- Change: `web/lib/api/projects.ts` / any API wrappers if needed to pass through
- Potentially affected: pages/components that destructure these objects

**Tests:**
- Type-level checks compile; add minimal DTO mapping tests if needed.

**Status:** Not Started

---

### Step 3: Server helpers for signed uploads (projects/collabs)
**Goal:** Securely upload and persist logos for projects and collaborations.

**What we are doing:** Add two functions per entity to request a signed URL and to set the logo path once uploaded.

**Technical details:**
- Projects (in `web/lib/server/projects.ts`):
  - `requestProjectLogoUpload(projectId, { ext }) -> { uploadUrl, path, maxBytes: 1_000_000, mime: [...] }`
    - Auth required; owner-only. Generate single-use signed URL for `project-logos/<projectId>/<uuid>.<ext>`.
  - `setProjectLogo(projectId, path) -> { ok: true }`
    - Auth required; owner-only. Validate bucket/prefix, size ≤1MB, content-type in whitelist; update `projects.logo_path`.
- Collabs (in `web/lib/server/collabs.ts`): mirror with `requestCollabLogoUpload` / `setCollabLogo` under `collab-logos/<collabId>/...`.
- Use service client only on server, never in client runtime.

**Files:**
- Change: `web/lib/server/projects.ts`
- Change: `web/lib/server/collabs.ts`
- Change: `web/app/projects/actions.ts` (add server actions wrappers)
- Change: `web/app/collaborations/actions.ts` (add server actions wrappers)
- Potentially affected: `web/lib/supabaseService.ts` (reuse existing service client)

**Tests:**
- Server tests for owner-only checks; reject wrong prefix/bucket; reject large/invalid mime.

**Status:** Not Started

---

### Step 4: Profile avatar upload (self)
**Goal:** Allow users to upload/edit their profile picture.

**What we are doing:** Add request/set avatar functions analogous to logos, and surface upload in profile edit.

**Technical details:**
- Server (new or extend profile actions):
  - `requestProfileAvatarUpload() -> { uploadUrl, path, maxBytes, mime }` with key `profile-avatars/<userId>/<uuid>.<ext>`.
  - `setProfileAvatar(path) -> { ok: true }` with validation then update `profiles.avatar_path`.
- UI: integrate into `/profile/edit` as optional upload with preview, and render avatar in profile view/navbar if present.

**Files:**
- Change: `web/app/profile/actions.ts` (add request/set)
- Change: `web/app/profile/edit/page.tsx` (add uploader section)
- Change: `web/components/layout/*` or navbar if avatar is shown (check existing UI)
- Potentially affected: `web/lib/api/auth.ts` (if profile fetch shape changes), profile components

**Tests:**
- Owner/self validation; path/mime/size checks; UI fallback when no avatar.

**Status:** Not Started

---

### Step 5: Reusable LogoUploader component
**Goal:** Consistent, safe client upload UX for logos/avatars.

**What we are doing:** Implement a small client component handling file selection, validation, preview, and the two-call flow (request → PUT → set) with toasts and disabled states.

**Technical details:**
- Accepts props: `entity: 'project'|'collab'|'profile'`, `entityId?`, `requestAction`, `setAction`, `currentPath?`, size/mime limits.
- Validates file type and size; extracts extension; handles error states; emits `onComplete(path)`.
- Uses `fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'content-type': mime } })`.

**Files:**
- Add: `web/components/ui/logo-uploader.tsx`
- Potentially affected: any page integrating it

**Tests:**
- Component test: rejects oversize/invalid mime; calls actions in correct order; renders fallback state.

**Status:** Not Started

---

### Step 6: Integrate logos into UI (projects/collabs)
**Goal:** Display logos with fallbacks across list and detail pages; add optional upload on create forms.

**What we are doing:** Add an `Image` slot to cards/detail headers. On create pages, add an optional “Upload your logo” section that performs upload then includes the stored path with submission (or allows setting after creation on detail page).

**Technical details:**
- Rendering: use `next/image` with `images.unoptimized = true`. Sizes: list 40–48px square; detail 96px.
- Fallback: `public/placeholder-logo.svg` or `.png` if missing/broken.
- Create forms: optional uploader placed at bottom; if uploaded before submit, include hidden `logoPath` field to pre-set; otherwise can upload later from detail page.

**Files:**
- Change: `web/components/features/projects/project-card.tsx` (add logo)
- Change: `web/app/projects/[id]/page.tsx` (add logo in header + owner uploader)
- Change: `web/app/projects/new/page.tsx` (optional uploader section)
- Change: `web/app/collaborations/page.tsx` (add logo to list item)
- Change: `web/app/collaborations/[id]/page.tsx` (add logo + owner uploader)
- Change: `web/app/collaborations/new/page.tsx` (optional uploader)
- Add: `web/public/placeholder-logo.svg` (if not present)
- Potentially affected: `web/components/features/...` where owner toolbars live

**Tests:**
- UI tests: renders logo when `logoPath` present; renders placeholder otherwise; create-page optional flow does not block submission.

**Status:** Not Started

---

### Step 7: Tests, docs, and changelog
**Goal:** Ensure correctness and document the feature.

**What we are doing:** Add targeted tests, update specs and schema docs, and record user-visible change.

**Technical details:**
- Server tests: authorization/path/mime/size.
- Update docs with new actions and columns; mark Stage 15 as complete on merge.

**Files:**
- Add: `web/tests/logos.server.test.ts`
- Add: `web/tests/avatars.server.test.ts`
- Add: `web/tests/logo-render.ui.test.ts`
- Change: `docs/SERVER_ACTIONS.md` (new actions)
- Change: `supabase/schema.md` (columns + buckets)
- Change: `docs/MVP_TECH_SPEC.md` (stage status)
- Change: `CHANGELOG.md` (Unreleased → Added: logos & avatars)

**Tests:**
- All new tests pass locally (vitest); existing suite remains green.

**Status:** Not Started

--- 

## Acceptance Criteria

- Owners can upload/replace project and collaboration logos (≤1MB; PNG/JPEG/SVG) via signed URLs; non-owners cannot.
- Users can upload/replace their profile avatar under the same limits; only self can update.
- Logos/avatars render on lists and detail pages with placeholders when absent.
- Optional logo upload available at the bottom of create forms; not required to submit.
- No service role key is exposed to client; uploads use one-time signed URLs.
- Docs updated (actions, schema), tests added and passing; green build.

## Workflow

At each step in 'Actionable and specific steps':

- Explain clearly what we are doing and why (layman’s terms), add technical details when terms are used.
- Inspect relevant code, documents, and `.cursorrules` before making changes.
- Implement minimal, robust, reusable code; identify all affected files to prevent regressions.
- Add/adjust tests; ensure all tests pass.
- Guide user to review code/UI; after approval, update progress tracking and docs.
- Commit with Conventional Commits and push. ONLY then proceed to the next step.

## Progress Tracking

| Step | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| 1. DB & Buckets | Not Started | — | — |  |
| 2. Types & DTOs | Not Started | — | — |  |
| 3. Server: project/collab logos | Not Started | — | — |  |
| 4. Profile avatars | Not Started | — | — |  |
| 5. LogoUploader component | Not Started | — | — |  |
| 6. UI integration (lists/detail/forms) | Not Started | — | — |  |
| 7. Tests & Docs | Not Started | — | — |  |

## Risk Mitigation

- Security: no client exposure of service role; uploads always via signed URLs; validate size/mime/path.
- Performance: public-read buckets for fast rendering; small image caps; use Next Image unoptimized mode as configured.
- UX: optional upload on create to avoid friction; owner-only controls on detail pages; clear error toasts.
- Compatibility: minimal schema changes; selectors and UI guarded with optional fields/fallbacks; degrade gracefully if columns absent during rollout.

---

**Last Updated:** 18/9/2025  
**Next Review:** After Step 3 implementation
