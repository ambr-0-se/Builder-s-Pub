# Stage 14 Implementation Plan: Tag Curation & Validation Tweaks

**Status:** Completed  
**Started:** 16/9/2025  
**Completed:** —

## Overview

Stage 14 focuses on improving tag governance and form UX so projects and collaborations stay clear and scannable as the tag vocabulary grows. We will: enforce case‑insensitive uniqueness of tags, cap the number of selected tags in forms, add light tag‑picker refinements (filter, suggested list, scrollable list, selection guardrails), and curate a sensible starting list of technology and category tags. All changes are deliberately minimal and safe, aligning with the existing patterns.

## Tasks

1. Case‑insensitive uniqueness for `tags` at the database level and in Admin UI.
2. Enforce a cap of 10 total tags (technology + category) for both projects and collaborations (project types do not count toward the collaboration cap).
3. Light tag‑picker UX refinements in project and collaboration creation forms: filter input, suggested list, scrollable list, selection counter/guardrails.
4. Curate and seed initial technology/category tags (additive; no renames), and review existing tags.
5. Tests, documentation updates, and changelog entry.
6. QA: keep build/test green and verify UX.

## Actionable and Specific Steps

### Step 1: Add case‑insensitive unique index for tags
**Goal:** Prevent duplicates like "nlp" vs "NLP" by enforcing uniqueness on `type + lower(name)`.

**What we are doing:** Make the database reject adding the same tag with different letter casing, so the tag list stays clean.

**Technical details:**
- Create a unique index: `create unique index if not exists uq_tags_type_lower_name on tags (type, lower(name));`
- Keep existing `unique (name, type)` (harmless alongside CI index). Document rationale in schema docs.
- Add migration; reflect the index in `supabase/schema.sql` and `supabase/schema.md`.

**Files:**
- Add: `supabase/migrations/20250916000000_add_ci_unique_tags.sql`
- Change: `supabase/schema.sql`, `supabase/schema.md`

Tests: Apply migration; insert `NLP` then `nlp` → expect unique violation; Admin UI duplicate message shows.

**Status:** Completed

---

### Step 2: Normalize admin tag input + friendly duplicate messaging
**Goal:** Ensure whitespace/casing normalized before validation and show a clear error if a case‑insensitive duplicate exists.

**What we are doing:** Clean up the tag name (trim extra spaces) before saving. If the tag already exists (even with different casing), show an easy‑to‑understand error.

**Technical details:**
- Update validation to trim and collapse inner whitespace (e.g., multiple spaces → single space).
- Preserve 23505 handling; update error copy to "Tag already exists (case‑insensitive)."
- Pre‑submit UI check: warn inline if a case‑insensitive match exists.

**Files:**
- Change: `web/lib/validation/tags.ts` (normalize input)
- Change: `web/app/admin/tags/actions.ts` (error message)
- Change: `web/app/admin/tags/tag-manager.tsx` (inline notice before submit)
- Change: `web/app/admin/tags/AdminCreateTagForm.tsx` (mirror inline notice)

Tests: Unit test normalization; create "  Computer   Vision " → saved as "Computer Vision"; casing duplicate blocked.

**Status:** Completed

---

### Step 3: Enforce max 10 tags for projects (tech+category)
**Goal:** Limit total selected tags to at most 10 across technology and category for projects.

**What we are doing:** Prevent picking too many tags so project pages stay readable. Show a counter and stop at 10.

**Technical details:**
- Server validation: add `.superRefine` to `createProjectSchema` to enforce `techTagIds.length + categoryTagIds.length ≤ 10` with a single clear error message.
- UI guardrails: show a live counter (e.g., "7/10 selected"); disable additional chips once at 10; allow deselection.
- No changes to server actions contract beyond error message text.

**Files:**
- Change: `web/app/projects/schema.ts`
- Change: `web/app/projects/new/page.tsx`
- Potentially affected: `web/app/projects/actions.ts` (surface validation errors), `web/tests/projects.schema.test.ts`

Tests: Schema accepts 10 tags, rejects 11; UI disables 11th chip and shows counter.

**Status:** Completed

---

### Step 4: Enforce max 10 tags for collaborations (tech+category only)
**Goal:** Limit total selected tags to at most 10 across technology and category for collaborations (project types are not counted).

**What we are doing:** Same cap as projects, but project types (like personal, open source) don't count.

**Technical details:**
- Server validation: add `.superRefine` to `createCollabSchema` to enforce `techTagIds.length + categoryTagIds.length ≤ 10`.
- UI guardrails: show a live counter; disable chips once the 10 limit is reached; allow deselection.

**Files:**
- Change: `web/app/collaborations/schema.ts`
- Change: `web/app/collaborations/new/page.tsx`
- Potentially affected: `web/app/collaborations/actions.ts`, new test file `web/tests/collabs.schema.cap.test.ts`

Tests: Schema accepts 10 tags, rejects 11; project types ignored; UI disables 11th tag.

**Status:** Not Started

---

### Step 5: Light tag‑picker UX refinements (both forms)
**Goal:** Keep forms tidy as the vocabulary grows: add a small search, suggested tags, and scrollable lists with counters.

**What we are doing:** Add a tiny search box to filter tags, show a short "Suggested" list at the top, and make long lists scroll. Also show "X/10 selected" and stop selecting more when full.

**Technical details:**
- Per facet (Technology, Category):
  - Filter input that narrows the local chip list (client‑side only).
  - A curated "Suggested" subsection (first 8–12 curated tags per facet) above the full list.
  - Wrap full list in a container with `max-height` and `overflow-y: auto`.
  - Selection counter and chip disabling when at cap.
- No API/schema changes.

**Files:**
- Change: `web/app/projects/new/page.tsx`
- Change: `web/app/collaborations/new/page.tsx`

Tests: Render test verifies filter narrows chips; suggested renders; scroll container present; manual counter/disable works.

**Status:** Completed

### Step 5b: Replace tag lists with combobox + quick‑pick chips
**Goal:** Reduce visual clutter and align with industry patterns (chips + searchable combobox).

**What we are doing:** Show a short row of quick‑pick chips (curated) and a single combobox to add more by searching alphabetically. Selected chips render inline; non‑selected options are hidden from the list. Cap is enforced per facet.

**Technical details:**
- New reusable `TagMultiSelect` component with props `{ label, options, value, onChange, max, pinned?, variant }`.
- Features: quick‑pick chips (toggle), searchable dropdown (substring + alphabetical), keyboardable, click ▾ to toggle, click area to open, blur closes. Variants style colors (tech=blue, category=green).
- Per‑facet caps: Technology ≤ 5, Category ≤ 3.

**Files:**
- Add: `web/components/ui/tag-multiselect.tsx`
- Change: `web/app/projects/new/page.tsx`, `web/app/collaborations/new/page.tsx`

Tests: Component covered indirectly; end‑to‑end caps validated by schema tests; manual UI check for open/close and pin behavior.

**Status:** In Progress

---

### Step 6: Curate and seed initial tag lists; review existing
**Goal:** Provide a generally understandable set of technology and category tags; review current tags without renaming.

**What we are doing:** Use well‑known sources to draft simple tag lists people understand (e.g., NLP, Computer Vision, Education, Finance). Add them to seeds and check what we already have.

**Technical details:**
- Research references and cite links in spec:
  - Hugging Face — Tasks (https://huggingface.co/tasks)
  - Papers with Code — Tasks (https://paperswithcode.com/task)
  - Product Hunt — Topics (https://www.producthunt.com/topics)
  - LinkedIn — Industry codes (https://learn.microsoft.com/linkedin/shared/references/reference-tables/industry-codes)
- Draft lists (longer allowed due to searchable dropdown). Include: Vibe Coding, Data Science, Data Analytics, Traditional ML, Model Training, Fine‑tuning; plus Sports, Marketing, and common university subjects.
- Append to `seed_mvp.sql` with `on conflict do nothing` (non‑destructive).
- Store the curated snapshot at `docs/tags/curated-tags.csv` for provenance.

**Files:**
- Change: `supabase/seed/seed_mvp.sql`
- Add (optional): short report attached in PR description (no repo file changes required)

Tests: Re-run seeds idempotently; curated tags visible in UI; existing tags unchanged; PR report lists dupes/gaps.

**Status:** Completed

---

### Step 7: Tests
**Goal:** Ensure validation and basic UX behavior are covered.

**What we are doing:** Add tests so we don’t accidentally break the caps or tag validation later.

**Technical details:**
- Project cap tests: extend `projects.schema.test.ts` to check pass/fail around 10.
- Collaboration cap tests: add `collabs.schema.cap.test.ts` (new) for 10‑tag limit excluding project types.
- Tag validation tests: extend `tags.validation.test.ts` for normalization and case‑insensitive duplicate messaging (unit level).

**Files:**
- Change: `web/tests/projects.schema.test.ts`
- Add: `web/tests/collabs.schema.cap.test.ts`
- Change: `web/tests/tags.validation.test.ts`

Tests: `pnpm test` runs new cases; they pass and fail appropriately when constraints are violated.

**Status:** Not Started

---

### Step 8: Documentation & Changelog
**Goal:** Keep specs and schema docs accurate; add user‑visible note.

**What we are doing:** Update our manuals so future devs know about the new rules and users see what changed.

**Technical details:**
- `docs/MVP_TECH_SPEC.md`: mark Stage 14 as done; document 10‑tag cap and CI uniqueness.
- `supabase/schema.md`: add the new index and rationale.
- `docs/SERVER_ACTIONS.md`: note validation errors for tag caps.
- `CHANGELOG.md` under Unreleased: summarize user‑visible changes.

**Files:**
- Change: `docs/MVP_TECH_SPEC.md`, `supabase/schema.md`, `docs/SERVER_ACTIONS.md`, `CHANGELOG.md`

Tests: Manual doc review; ensure caps and CI uniqueness documented; changelog entry present.

**Status:** In Progress

---

### Step 9: QA (lint/build/tests + manual smoke)
**Goal:** Ensure everything is green and UX is smooth.

**What we are doing:** Run checks and click through forms to confirm the experience feels right.

**Technical details:**
- Run `pnpm lint && pnpm test` locally; fix failures.
- Manual: Admin adds a casing variant → UI warns; DB blocks with friendly error. Project/Collab forms show suggested tags, filter works, lists scroll, and selection caps at 10.

**Files:**
- No new files; verify changes across touched files.
Tests: `pnpm lint && pnpm test`; manual Admin duplicate attempt; forms show filter/suggest/scroll and cap at 10.

**Status:** Not Started

---

## Acceptance Criteria

- Database rejects case‑insensitive duplicate tags (`unique(type, lower(name))` in place).
- Admin tag creation warns for case‑insensitive duplicates and shows a friendly error if submitted.
- Project and Collaboration forms:
  - Show a "Suggested" subsection for each facet, plus a scrollable full list.
  - Provide a filter input per facet that narrows visible tags.
  - Display a live counter and prevent selecting more than 10 total tags (tech+category). Collaboration cap excludes project types.
- Curated initial tag lists appended to seeds; existing tags unchanged; brief review report provided in PR.
- Tests added/updated and passing.
- Docs updated: MVP spec, schema overview, server actions, and changelog.

## Workflow

At each step in 'Actionable and specific steps':

- Explain clearly on what you are doing and the rationale behind with layman's term, and add detailed explanation if technical term is used. 
- Inspect relevant code, documents, and ‘.cursorrules’ before making change.
- Code the changes, and make sure codes are robust, reusable and modular. 
- Identidy the files that the code would affect and prevent any bug.
- Add testcases for the change. Then, make sure all testcases are passed.
- Guide user to review the code changes and functionality change in UI.
- After user's review and approval, update progress tracking and other relevant documents.
- Lastly, commit and push changes to Github.
- ONLY when everything above is done, proceed to the next step in ‘Actionable and specific steps’

If you need help from user, give clear instructions to user on how to do it or what needs to be decided on.

## Progress Tracking

| Step | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| 1. CI unique index | Completed | 16/9/2025 | 17/9/2025 | Migration + schema docs updated |
| 2. Admin tag normalization + messaging | Completed | 17/9/2025 | — | Inline warning + error copy |
| 3. Project 10‑tag cap | Completed | 16/9/2025 | 17/9/2025 | Schema superRefine + UI counter/disable |
| 4. Collaboration 10‑tag cap | Completed | 16/9/2025 | 17/9/2025 | Exclude project types from cap; UI aligned with projects |
| 5. Tag‑picker UX (filter/suggest/scroll/counter) | Completed | 17/9/2025 | 17/9/2025 | Replaced with combobox + quick‑picks |
| 5b. Combobox + quick‑picks | Completed | 17/9/2025 | 17/9/2025 | `TagMultiSelect` integrated |
| 6. Curate & seed + review existing | Completed | 17/9/2025 | 18/9/2025 | Curated CSV + seeds applied |
| 7. Tests | Not Started | — | — | Projects, Collabs, Tags validation |
| 8. Docs & Changelog | Not Started | — | — | Spec, schema, actions, changelog |
| 9. QA | Not Started | — | — | Lint/test + manual smoke |

## Risk Mitigation

**Data integrity**
- CI unique index prevents duplicate tags differing by case; keep existing unique (name, type) to avoid accidental removal.
- Seeds use `on conflict do nothing` to stay idempotent.

**UX regressions**
- Keep refinements minimal (client‑side filter, small suggested list, scroll, counter) with no API changes.
- Disable chips above cap while allowing deselection; clear inline messaging.

**Compatibility**
- No breaking changes to server action contracts; only additional validation error possible for caps.
- Admin UI changes are additive; existing admin flows continue to work.

**Testing & rollout**
- Add unit tests for schema refinements and validation.
- Manual smoke on forms and admin page before merging.

---

**Last Updated:** 17/9/2025
**Next Review:** On implementation completion


