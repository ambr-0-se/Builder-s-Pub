# Stage 12 Implementation Plan: Analytics

**Status:** 🔄 In Progress  
**Started:** 10/9/2025  
**Completed:** TBD  

## Overview

Stage 12 replaces the temporary analytics mock with a real analytics provider and ensures core user journeys are tracked end-to-end with correct event shapes and properties. We will minimally and safely integrate PostHog (or a compatible interface) while preserving privacy (no PII), robustness (graceful fallbacks when disabled), and code consistency. We will also fill gaps in instrumentation (e.g., signup, profile updates, project views) per `docs/ANALYTICS.md`.

## Tasks

### 1. Provider & Environment Setup
Install the analytics SDK, wire environment variables, and add a top-level provider with graceful no-op fallback when keys are absent.

### 2. Client Analytics Hook & Provider Component
Create a small client-side provider to initialize analytics and expose a typed `useAnalytics()` hook compatible with current usages.

### 3. Server-Side Tracking Utility
Provide a server-safe `trackServer()` that mirrors the client API and falls back to structured logging when disabled.

### 4. Event Naming & Property Alignment
Align event names to snake_case and properties to lowerCamelCase; ensure required common properties are attached where feasible.

### 5. Instrument Missing Core Events
Add `signup`, `profile_update`, and debounced `project_view` on detail page mount.

### 6. Replace Mock Usages
Swap `useAnalyticsMock()` and current console logging with the real implementation across the codebase.

### 7. Tests
Unit-test the wrapper and key server actions to verify events are emitted with correct names/properties, using module mocks.

### 8. Documentation Updates
Update analytics docs, environment docs, and technical spec; add an Unreleased changelog note if user-visible.

## Actionable and Specific Steps

### Step 1: Add SDK and Environment Wiring
**Goal:** Install the analytics SDK and define environment configuration with safe defaults.

**What we're doing:** We integrate a real analytics tool so events are captured outside the local console. If the analytics key isn’t configured, the app will safely do nothing (no errors or broken UX).

**Technical details:**
- SDK: `posthog-js` (client). We keep our own thin wrapper to avoid vendor lock-in.
- Env: Use `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` (already present) and handle “disabled” mode when key missing.
- Privacy: Do not send PII; respect DNT where feasible.

**Files to modify/create:**
- Modify: `web/package.json` (dependency added)
- Verify: `web/.env.local.example` (keys already listed)
- Verify: `ops/ENVIRONMENT.md` (keys documented; add brief enable/disable note)

**Status:** ✅ Completed

---

### Step 2: Create Client Provider and Hook
**Goal:** Initialize analytics in a React provider and expose a typed hook compatible with current usage sites.

**What we're doing:** We add a small component that starts analytics once in the app and a hook `useAnalytics()` that developers can call to track events. This mirrors how the mock was used but now actually sends data.

**Technical details:**
- `AnalyticsProvider` (client component) initializes PostHog if a key exists; otherwise becomes a no-op provider.
- `useAnalytics()` returns `{ track(event, properties) }` typed to our event union.
- Debounce helper exported for view events.

**Files to create:**
- Create: `web/components/analytics/AnalyticsProvider.tsx`

**Files to modify:**
- Modify: `web/app/layout.tsx` (wrap children with `AnalyticsProvider`)
- Modify: `web/lib/analytics.ts` (export `useAnalytics` and `trackServer`, keep API-compatible signature)

**Status:** ✅ Completed

---

### Step 3: Implement Server-Side Tracker
**Goal:** Provide `trackServer(event, properties)` that is safe in server actions and logs in dev/disabled modes.

**What we're doing:** On the server, we can’t use browser SDKs. We’ll keep a minimal function that either sends events via a server-friendly mechanism later (optional) or logs structured lines in dev/disabled mode. This ensures we never break server actions.

**Technical details:**
- Maintain current call sites but route through the new implementation.
- When analytics is disabled, log with `[Analytics]` prefix and sanitized properties.
- Ensure no secrets or PII are logged.

**Files to modify:**
- Modify: `web/lib/analytics.ts` (implement robust server-side `trackServer`)

**Status:** ✅ Completed

---

### Step 4: Align Event Names and Properties
**Goal:** Use snake_case for event names and lowerCamelCase for properties per `docs/ANALYTICS.md`.

**What we're doing:** We standardize names so analysis and dashboards are consistent. We will map any existing differing names to the documented names with minimal code churn.

**Technical details:**
- Confirm and align names: `project_create`, `project_view`, `upvote_toggled`, `comment_added`, `comment_deleted`, `reply_added`, `collab_create`, `search_performed`, `filter_apply`, `signup`, `profile_update`.
- Common props: `userId` (if known), `sessionId` (if available), `ts`.
- Context props per doc (e.g., `projectId`, `techTags`, `categoryTags`, etc.).

**Files to modify:**
- Modify: `web/lib/analytics.ts` (event union/types)
- Modify: all current usage sites to ensure event string alignment (see Step 6 list)

**Status:** ✅ Completed

---

### Step 5: Instrument Missing Events
**Goal:** Add `signup`, `profile_update`, and `project_view` (debounced 1s) where missing.

**What we’re doing:** We fill gaps so key funnels are measurable: new user signup, profile completion, and project detail views.

**Technical details:**
- `signup`: fire in `auth/callback` after a first-time profile ensure succeeds (idempotent, safe to emit once per new user session).
- `profile_update`: emit after successful profile save.
- `project_view`: client-side, debounced on detail page mount to avoid double fires.

**Files to modify/create:**
- Modify: `web/app/auth/callback/page.tsx` (emit `signup` when appropriate)
- Modify: `web/app/profile/actions.ts` (emit `profile_update` on success)
- Create: `web/app/projects/[id]/ProjectViewTracker.tsx` (client component that debounces and fires `project_view`)
- Modify: `web/app/projects/[id]/page.tsx` (render `ProjectViewTracker` with ids/tags)

**Status:** ✅ Completed

---

### Step 6: Replace Mock Usages With Real Tracking
**Goal:** Swap `useAnalyticsMock()` calls with `useAnalytics()` and keep server `trackServer()` calls working.

**What we’re doing:** We change imports minimally at all existing usage sites, preserving call shapes, to start sending real data.

**Files to modify (based on repo grep):**
- `web/app/projects/page.tsx`
- `web/app/projects/new/page.tsx`
- `web/app/projects/actions.ts`
- `web/app/projects/[id]/created-toast.tsx`
- `web/app/collaborations/actions.ts`
- `web/app/search/page.tsx`
- `web/components/features/projects/project-card.tsx`
- `web/lib/analytics.ts` (replace mock exports)

**Potentially affected by ripple changes:**
- Any components importing from `@/lib/analytics`

**Status:** ✅ Completed

---

### Step 6.1: Unify `filter_apply` Schema Across Search and Projects
**Goal:** Ensure a single, consistent analytics schema for filter application events on both `/projects` and `/search`.

**What we’re doing:** Standardize the event properties so dashboards and queries remain consistent regardless of where filters are applied. We retain one event name (`filter_apply`) and distinguish context with a `type` property.

**Canonical schema:**
- event: `filter_apply`
- properties:
  - `type`: `'projects' | 'collabs'`
  - `techTagIds`: `number[]`
  - `categoryTagIds`: `number[]`
  - `stages?`: `string[]` (only when `type='collabs'`)
  - `projectTypes?`: `string[]` (only when `type='collabs'`)
  - `triggeredBy?`: `'filters'` (optional provenance)

**Files to modify:**
- `web/app/projects/page.tsx` (change emitted keys to `techTagIds` / `categoryTagIds`; include `type: 'projects'`)
- `web/app/search/page.tsx` (when emitting `filter_apply`, use unified keys and include `type: tab`)

**Tests to add:**
- `web/tests/analytics.search.events.test.ts` (new)
  - Emits `filter_apply` with unified schema on filter change when `hasSearched=true`.
  - No duplicate `filter_apply` when filters do not change (signature guard).
  - `search_performed` still fires after results load.

**Status:** ✅ Completed

---

### Step 7: Tests
**Goal:** Verify instrumentation by asserting wrapper calls with correct names/properties and server action integration.

**What we’re doing:** We add unit tests that mock the analytics module and assert calls. No external network calls occur in tests.

**Technical details:**
- Mock `web/lib/analytics.ts` and assert `track`/`trackServer` calls in server action tests.
- Add wrapper tests for disabled/enabled modes.

**Files to create/modify:**
- Create: `web/tests/analytics.wrapper.test.ts`
- Create: `web/tests/analytics.events.test.ts` (server action emission for comments/upvotes/collabs)
- Modify: existing tests if event names changed (keep changes minimal)

**Status:** ✅ Completed

---

### Step 8: Documentation Updates
**Goal:** Reflect the real analytics implementation, verification steps, and privacy notes.

**What we’re doing:** We keep docs in sync so future contributors can enable/disable analytics and understand event shapes.

**Files to modify:**
- `docs/ANALYTICS.md` (replace mock notes with provider + fallback details; confirm event list)
- `ops/ENVIRONMENT.md` (note how to enable/disable analytics via env)
- `docs/MVP_TECH_SPEC.md` (mark Stage 12 as completed when done)
- `CHANGELOG.md` (Unreleased: “Add analytics provider and instrumentation”)

**Status:** ⏳ Pending

---

## Acceptance Criteria

### Implementation
- ✅ Real analytics provider initialized with graceful no-op when key missing.
- ✅ `useAnalytics()` and `trackServer()` available and type-safe.
- ✅ Event names are snake_case; properties are lowerCamelCase.
- ✅ No PII is sent; respect privacy guidance in `docs/NFR.md`.

### Event Coverage
- ✅ `signup` emitted on first successful auth-callback profile ensure.
- ✅ `profile_update` emitted on successful profile save.
- ✅ `project_view` emitted on detail mount (debounced 1s).
- ✅ Existing events (comments, upvotes, collabs, search, filter) continue to fire with aligned naming.

### Tests & DX
- ✅ Unit tests for analytics wrapper and server action emissions pass.
- ✅ No regressions in existing tests; build and lint are green.
- ✅ Clear docs for enabling analytics and verifying events.

## Workflow

At each step in 'Actionable and specific steps':

```
At each step in ‘Actionable and specific steps’, 
- Explain clearly on what you are doing and the rationale behind with layman's term, and add detailed explanation if technical term is used. 
- Inspect relevant code, documents, and ‘.cursorrules’ before making change.
- Code the changes, and make sure codes are robust, reusable and modular. 
- Identidy the files that the code would affect and prevent any bug.
- Add testcases for the change. Then, make sure all testcases are passed.
- After each atmoic change, guide user to review it
- After user's approval, push changes to Github 
- Do not forget to write test cases and update documentation.
- Proceed to the next step in ‘Actionable and specific steps’
```

We will strictly adhere to this cadence, requesting explicit approval between steps and updating this document’s progress table.

## Progress Tracking

| Step | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| 1. SDK & Env Wiring | ✅ Completed | 10/9/2025 | 10/9/2025 | Dependency added, env notes updated |
| 2. Client Provider & Hook | ✅ Completed | 10/9/2025 | 10/9/2025 | `AnalyticsProvider` added; `useAnalytics()` ready |
| 3. Server Tracker | ✅ Completed | 10/9/2025 | 10/9/2025 | Structured server logging; client-guard |
| 4. Names & Properties Alignment | ✅ Completed | 10/9/2025 | 10/9/2025 | Canonical names added; normalization refined |
| 5. Missing Events | ✅ Completed | 10/9/2025 | 10/9/2025 | Added signup, profile_update, project_view; server project_create |
| 6. Replace Mocks | ✅ Completed | 10/9/2025 | 10/9/2025 | Replaced mock with real hooks; server uses trackServer |
| 7. Tests | ⏳ Pending | 10/9/2025 | TBD | Wrapper + server action tests |
| 8. Documentation Updates | ✅ Completed | 10/9/2025 | 10/9/2025 | Analytics config/verify; Env guide updated |

## Risk Mitigation

**Privacy & Security**
- No PII in events; only ids and non-sensitive context per `docs/NFR.md`.
- Respect DNT where feasible; provide easy disable via env.
- Avoid exposing service role keys to the client (not used for analytics).

**Reliability & Performance**
- Debounce view events; batch where appropriate (SDK defaults).
- No-op fallback to avoid runtime errors when keys are missing.
- Keep wrapper minimal to reduce maintenance and vendor lock-in risk.

**Data Quality**
- Standardized naming and properties; unit tests to assert shapes.
- Idempotent `signup` emission to prevent duplicates.

**Change Impact**
- Minimal import changes; preserve call shapes.
- Comprehensive test run to catch regressions.

**Lint/Type Cleanup Scope**
- Stage 12 will only address lint/type issues in files touched by analytics changes (to avoid scope creep).
- Broader lint cleanup is deferred to Stage 13 as a small subtask (see MVP Tech Spec), keeping this stage minimal and focused.

---

**Last Updated:** 10/9/2025  
**Next Review:** After Step 2 completion
