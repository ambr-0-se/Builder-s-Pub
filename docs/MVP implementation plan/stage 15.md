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

**Status:** ✅ Completed

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

**Status:** ✅ Completed

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

**Status:** ✅ Completed

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
**Goal:** Display logos with fallbacks across list and detail pages; add optional upload on create forms using a dropzone card at the bottom of the form; persist `logo_path` on create.

**What we are doing:**
- Add `Image` slots to list/detail views for projects/collabs.
- On create pages, add a dropzone card (Option A) that uploads the file and writes a hidden `logoPath` field submitted with the form. Owners can still change the logo later via the detail page.
- Detail pages (owner-only): adopt an avatar-style overlay with a headless native file picker (no large dropzone), optimistic preview, inline uploading spinner always visible during upload, and no-page-reload finalization with cache-busted URL.

**Technical details (shared):**
- Rendering: `next/image` with `images.unoptimized = true`. Use fixed, square containers with `object-cover object-center` to capture the middle portion without stretch (natural center‑crop effect).
- Fallback: Monogram avatar with gradient background when no `logoPath`/`logoUrl` present. Deterministic colors from item title; 1–2 initials centered. Secondary static fallback `public/placeholder-logo.svg` remains available.
- Path validation (already enforced in schemas):
  - Projects: `logoPath` must start with `project-logos/<projectId>/` (or temporary `project-logos/new/<userId>/` prior to create).
  - Collaborations: `logoPath` must start with `collab-logos/<collabId>/`.
- Create schemas: include optional `logoPath?: string` (already added) with prefix checks.
- Server create:
  - Projects / Collaborations: if `logoPath` present and valid, persist to `logo_path`.

**Sub‑step 6.1: List & Detail Rendering**
- Files:
  - Change: `web/components/features/projects/project-card.tsx` (48×48 logo, object-cover)
  - Change: `web/app/projects/[id]/page.tsx` (96×96 logo in header)
  - Change: `web/app/collaborations/page.tsx` (40×40 logo)
  - Change: `web/app/collaborations/[id]/page.tsx` (96×96 logo in header)
  - Add/Change: `web/components/ui/logo-image.tsx` reusable image renderer with monogram gradient fallback; wired in all the above.
- Tests:
  - UI smoke: placeholder shown when `logoPath` absent; no regressions.

**Sub‑step 6.1b: Submit gating, correct rendering, temp cleanup (Create pages)**
- Goal: Ensure logos persist reliably on submit; render using public URLs; reduce duplicate temp uploads.
- Technical details:
  - Ensure `logoPath` on submit: extend `LogoUploader` with `onPendingChange(pending:boolean)` that flips true when requesting/uploading and false when finished. Parent create pages disable the submit button while pending and only enable after `onUploadedPath` fires. Keep the hidden `<input name="logoPath">` in sync. Variables: `pendingUpload` in create pages; prop `onPendingChange` in `LogoUploader`.
  - Render via public URLs: add helper `toPublicUrl(path: string) => string` that maps `project-logos/...` → `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`. Apply when mapping server DTOs: in `toProjectWithRelations` and `toCollabWithRelations`, set `logoUrl` field (leave `logoPath` intact). Update UI to prefer `logoUrl || placeholder`.
  - Reduce duplicates in `*/new/<userId>/`: when a new file is selected while a previous temp path exists and wasn’t submitted, call a small server action `deleteTempLogo(path)` that verifies the prefix `*/new/<userId>/` and deletes that object. This runs before requesting the next signed URL. Add a low-priority follow-up: scheduled cleanup to delete temp objects older than 24h.
- Files:
  - Change: `web/components/ui/logo-uploader.tsx` (add `onPendingChange`, track previous temp path, call `deleteTempLogoAction` on replace)
  - Change: `web/app/projects/new/page.tsx` and `web/app/collaborations/new/page.tsx` (track `pendingUpload`, disable submit while pending)
  - Change: `web/lib/server/projects.ts` and `web/lib/server/collabs.ts` (add `toPublicUrl` usage in DTO mapping as `logoUrl`)
  - Add: `web/lib/server/logo-public-url.ts` (export `toPublicUrl`)
  - Add: `web/app/(shared)/actions/delete-temp-logo.ts` (server action calling `deleteTempLogo`)
  - Add: `web/lib/server/storage-cleanup.ts` (deleteTempLogo helper; optional scheduled cleanup stub)
- Tests:
**Sub‑step 6.1c: Owner-only logo change UX (detail pages)**
- Goal: Remove layout shift and page reload; provide instant feedback.
- Technical details:
  - Replace in-detail dropzone with a headless input[type=file] triggered by the overlay “Change” button.
  - Validate on client (PNG/JPEG/SVG, ≤1MB). On failure, show toast; do nothing.
  - On success: optimistically set a local ObjectURL as thumbnail, request signed URL, PUT, call set-logo action, then set final `src = toPublicUrl(path) + '?v=' + Date.now()` to bust cache.
  - Show an always-visible centered spinner overlay while `pending` is true (desktop + mobile).
  - “Remove Logo” clears to placeholder immediately and persists via clear action.
- Files:
  - Change: `web/components/ui/logo-change-overlay.tsx` (headless picker, optimistic preview, spinner, cache-busting, toasts)
  - Change: `web/app/projects/[id]/page.tsx`, `web/app/collaborations/[id]/page.tsx` (already wired to overlay component)
  - Change: `web/app/projects/actions.ts`, `web/app/collaborations/actions.ts` (request action types return non-null objects)
  - Change: `web/lib/publicUrl.ts` (used by overlay)

  - Component: uploader emits pending true/false; submit disabled while pending; hidden input updates after success.
  - Server: `toPublicUrl` mapping returns correct public URL; `deleteTempLogo` rejects non-`/new/<userId>/` paths.

**Sub‑step 6.1d: Finalize storage paths (move‑on‑submit) + backfill**
- Goal: Ensure canonical storage keys under entity ids and migrate any existing temp keys.
- Technical details:
  - Finalize on create: when `logoPath` is `project-logos/new/<userId>/…` or `collab-logos/new/<userId>/…`, after insert, move the object to `<bucket>/<entityId>/<filename>` (e.g., `project-logos/<projectId>/<filename>`) and update the DB row. If `move` is unavailable or fails, `copy` then `remove` as a fallback. On failure, keep the temp path (non‑blocking) and log.
  - Finalize on set: when setting a logo for an existing entity with a temp path (new/<userId>/…), move it immediately to `<entityId>/…` prior to persisting the new path in DB.
  - Helpers: centralize path logic and storage ops:
    - `isTempPathForUser(path, userId, bucket)` → boolean
    - `destForProject(projectId, filename)` / `destForCollab(collabId, filename)`
    - `moveObject(bucket, fromFull, toFull)` → `{ ok } | { error }` (tries move; copy+remove fallback)
- Files:
  - Add: `web/lib/server/logo-finalize.ts` (helpers above)
  - Change: `web/lib/server/projects.ts` (finalize temp path in `createProject` and in `setProjectLogo`)
  - Change: `web/lib/server/collabs.ts` (finalize temp path in `createCollab` and in `setCollabLogo`)
  - Add: `web/scripts/finalize-new-logos.ts` (one‑off backfill tool: find rows with `logo_path like '*/new/%'`, move to canonical `<entityId>/…`, update row; supports dry‑run)
  - Add: `.github/workflows/cleanup-new-uploads.yml` + `web/scripts/cleanup-new-uploads.ts` (scheduled 24h cleanup of stale temps under `*/new/<userId>/…`)
- Tests:
  - Server: set‑logo with temp path moves under entity id and updates DB; create with temp path finalizes post‑insert; reject temp paths that don’t belong to the current user. Implemented basic coverage in `web/tests/logos.server.test.ts`.
- Status: ✅ Completed

**Sub‑step 6.2: Project Create Page (dropzone at bottom)**
- UX (Option A): dashed, rounded dropzone card labeled "Drop your logo here, or browse"; requirement text below ("PNG, JPEG, or SVG — max 1MB"). Click or drop opens selection and auto-uploads immediately.
- Preview: square (e.g., 96×96) with `object-cover object-center`; inline "×" button to clear; "Uploading..." text during PUT.
- Accessibility: dropzone has role="button", keyboard activation, focus visible; errors and progress announced via `aria-live`.
- Wiring:
  - Use `LogoUploader` with `variant="dropzone"`, `requestNewProjectLogoUploadAction`, `preventReload`, and `onUploadedPath` to set `<input name="logoPath">`.
  - Place this dropzone section at the bottom of the form, just above Submit.
- Files:
  - Change: `web/app/projects/new/page.tsx`
  - Change: `web/components/ui/logo-uploader.tsx` (dropzone variant, drag/drop handlers, progress)
  - Change: `web/app/projects/actions.ts` (already includes `requestNewProjectLogoUploadAction`)
- Tests:
  - Component test: dropzone handles invalid type; `onUploadedPath` fires (basic covered in existing test; extend if time allows).

**Sub‑step 6.3: Collaboration Create Page (dropzone at bottom)**
- Same UX and placement as 6.2: auto-upload dropzone with inline "×" to clear.
- Files:
  - Change: `web/app/collaborations/new/page.tsx` (wire to `requestNewCollabLogoUploadAction`)
  - Change: `web/app/collaborations/actions.ts` (add `requestNewCollabLogoUploadAction`)
  - Change: `web/lib/server/collabs.ts` (add `requestNewCollabLogoUpload` server helper)
  - Change: `web/components/ui/logo-uploader.tsx` (shared)
- Tests:
  - Optional: component smoke as above.

**Files (summary):**
- Change: `web/components/features/projects/project-card.tsx`
- Change: `web/app/projects/[id]/page.tsx`
- Change: `web/app/collaborations/page.tsx`
- Change: `web/app/collaborations/[id]/page.tsx`
- Change: `web/app/projects/new/page.tsx` (dropzone bottom + hidden `logoPath`)
- Change: `web/app/collaborations/new/page.tsx` (dropzone bottom + hidden `logoPath`)
- Change: `web/components/ui/logo-uploader.tsx` (dropzone UI, DnD, progress, preview)
- Add: `web/components/ui/logo-image.tsx` (shared renderer)
- Change: `web/app/projects/schema.ts`, `web/app/collaborations/schema.ts` (optional `logoPath` with prefix checks)
- Change: `web/lib/server/projects.ts` / (collabs server if needed) (persist `logo_path` on create)
- Add: `web/public/placeholder-logo.svg` (if missing)

**Tests:**
- UI: logo renders when `logoPath` present; placeholder otherwise.
- Schema: `logoPath` optional; invalid prefixes rejected (projects/collabs).
- Server: `logo_path` set on create when provided and valid.

**Status:** ✅ Completed (22/9/2025)

---

### Step 6a: Profile avatar UI integration (Option B)
**Goal:** Provide a clean avatar change experience on `/profile/edit` and render avatar across `/profile` and navbar.

**What we are doing:** Use an avatar tile with a small “Change” overlay button. After selection, preview shows in the tile (square/circle) using `object-cover object-center`. Requirements stay visible below.

**Technical details:**
- `/profile/edit`: integrate `LogoUploader` with `variant="avatar"`, using `requestProfileAvatarUploadAction` + `setProfileAvatarAction`. Overlay button opens file picker; progress bar and inline errors; preview updates on success.
- `/profile`: if `avatarPath` present, render 80–96px rounded image with `object-cover object-center`; otherwise initial letter fallback.
- Navbar: if authenticated and `avatarPath` present, render a 24px rounded avatar next to (or instead of) the display name.
- Accessibility: overlay button keyboard focusable; announce errors via `aria-live`.

**Sub‑step 6a.1: Profile Edit (avatar overlay)**
- Files:
  - Change: `web/app/profile/edit/page.tsx` (insert avatar uploader block)
  - Change: `web/components/ui/logo-uploader.tsx` (avatar variant)
  - Uses existing profile actions.

**Sub‑step 6a.2: Profile View + Navbar**
- Files:
  - Change: `web/app/profile/page.tsx` (render avatar)
  - Change: `web/components/layout/navbar.tsx` (small avatar)

**Tests:**
- Component smoke (avatar variant): overlay triggers input; preview visible; no regressions.

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
| 1. DB & Buckets | ✅ Completed | 18/9/2025 | 18/9/2025 | Columns + buckets applied in Dashboard |
| 2. Types & DTOs | ✅ Completed | 18/9/2025 | 18/9/2025 | types + selectors map logo_path/avatar_path |
| 3. Server: project/collab logos | ✅ Completed | 18/9/2025 | 18/9/2025 | request*/set* helpers + actions added |
| 4. Profile avatars | ✅ Completed | 18/9/2025 | 18/9/2025 | request/set + actions implemented |
| 5. LogoUploader component | ✅ Completed | 18/9/2025 | 18/9/2025 | reusable uploader + tests |
| 6. UI integration (lists/detail/forms) | ✅ Completed | 18/9/2025 | 22/9/2025 | Lists/detail/create wired; owner overlay done; submit gating; public URL mapping; monogram fallback; server+UI tests added; temp cleanup + cron; finalize-on-submit + backfill in place. |
| 6a. Profile avatar UI integration | Not Started | — | — |  |
| 7. Tests & Docs | In Progress | 21/9/2025 | — | Server tests (owner/path/ext) and overlay UI tests added; docs updated (Server Actions, Tech Spec, Schema, Ops, Changelog). |

## Risk Mitigation

- Security: no client exposure of service role; uploads always via signed URLs; validate size/mime/path.
- Performance: public-read buckets for fast rendering; small image caps; use Next Image unoptimized mode as configured.
- UX: optional upload on create to avoid friction; owner-only controls on detail pages; clear error toasts.
- Compatibility: minimal schema changes; selectors and UI guarded with optional fields/fallbacks; degrade gracefully if columns absent during rollout.

---

**Last Updated:** 18/9/2025  
**Next Review:** After Step 3 implementation
