# Stage 13 Implementation Plan: Error Handling, Reporting, and External Link Disclaimer

**Status:** ✅ Completed 
**Started:** 16/9/2025  
**Completed:** 16/9/2025

## Overview

Stage 13 enhances reliability, trust, and safety by introducing friendly error pages, structured error reporting (client + server) with privacy protections, and a one‑time external link disclaimer. Current gaps: no global error pages, no reporting pipeline, and no global disclaimer for external links. This plan delivers minimal, robust changes aligned with our server action and analytics patterns.

## Tasks

1) Error pages
- Add global App Router pages: `error.tsx` and `not-found.tsx` with clear guidance for 401/403/409/500 and helpful actions.

2) Server error reporting endpoint
- Implement API route to receive client/server error reports, enrich, redact, and rate‑limit.

3) Privacy: anonymization + PII redaction
- Hash user id with server salt; redact emails/URLs from free‑text messages.

4) Client error reporter
- Lightweight client component to capture `onerror` and `unhandledrejection` and POST to the endpoint; include breadcrumbs.

5) Report problem page
- A simple `/report-problem` page and server action for user‑initiated reports with rate limit and success feedback.

6) External link disclaimer
- One‑time modal/toast shown on first external link open; store dismissal in `localStorage`; always use `rel="noopener noreferrer"`.

7) Tests
- Unit tests for redaction/anonymization and disclaimer persistence; integration test for report rate limit.

8) Documentation and changelog
- Update `MVP_TECH_SPEC.md`, `SERVER_ACTIONS.md`, `ARCHITECTURE.md`, `ops/ENVIRONMENT.md` (for salt), and `CHANGELOG.md`.

## Actionable and Specific Steps

### Step 1: Add global error pages
- Goal: Provide friendly `error.tsx` and `not-found.tsx` with guidance and actions.
- What we are doing: Adding site‑wide error screens so users aren’t stuck with cryptic messages; they’ll see helpful actions like “Try again,” “Go back,” or “Report a problem.”
- Technical details: App Router supports `web/app/error.tsx` and `web/app/not-found.tsx`. `error.tsx` can show a reset button; content avoids leaking internals but offers guidance (auth, permission, conflict, generic retry).
- Files to add/modify:
  - `web/app/error.tsx`
  - `web/app/not-found.tsx`
- Tests: Render smoke tests to ensure components mount and include expected CTAs.

### Step 2: Create error reporting endpoint and helpers
- Goal: Receive and process client/server error reports in a consistent format.
- What we are doing: Creating a “feedback pipe” where the app can send error details to the server, which cleans them and stores/logs them safely.
- Technical details: Add `POST /api/errors/report` accepting `{ message, context?, url?, userMessage? }`. Helpers to redact PII, anonymize user id, and enrich with route, UA, timestamp. Apply rate limiting using the existing `web/lib/server/rate-limiting.ts` utility (create/repurpose an `error_report` bucket, e.g., 10/min per user or per IP when anonymous) and return `{ error: 'rate_limited', retryAfterSec }` when exceeded.
- Files to add/modify:
  - `web/app/api/errors/report/route.ts`
  - `web/lib/server/errors.ts`
  - (Uses) `web/lib/supabaseServer.ts` for reading the user id (no changes expected)
- Tests: Unit tests for helpers; integration test for endpoint happy path.

### Step 3: Client error reporter component
- Goal: Automatically capture client runtime errors with minimal overhead.
- What we are doing: Adding a small listener that catches front‑end crashes and sends them to our server for visibility.
- Technical details: `ClientErrorReporter` listens to `window.onerror` and `unhandledrejection`, builds a compact payload, and POSTs to the endpoint (with simple debounce to avoid bursts). Mount once in `app/layout.tsx` near `AnalyticsProvider`.
- Files to add/modify:
  - `web/components/analytics/ClientErrorReporter.tsx`
  - `web/app/layout.tsx`
- Tests: Unit test for debounce/throttle util and request payload shape (mock fetch).

### Step 4: `/report-problem` page and server action
- Goal: Let users proactively report issues, optionally with a short description.
- What we are doing: Giving users a simple form to tell us when something’s wrong.
- Technical details: Page renders a form; server action `reportProblemAction` calls same helper path as API, respects rate limit, shows success toast and link back.
- Files to add:
  - `web/app/report-problem/page.tsx`
  - `web/app/report-problem/actions.ts`
- Tests: Action unit test for validation and rate limit path.

### Step 5: One‑time external link disclaimer
- Goal: Display a once‑per‑browser disclaimer when users open off‑site links.
- What we are doing: Showing a brief heads‑up the first time someone clicks an external link; they can choose not to see it again.
- Technical details: `ExternalLinkDisclaimer` component with modal/toast; intercept clicks on off‑origin `<a target="_blank">`; persist `ext_disclaimer_ack` in `localStorage`; instrument `external_link_proceed` via `useAnalytics()`.
- Files to add/modify:
  - `web/components/ExternalLinkDisclaimer.tsx`
  - `web/app/layout.tsx`
  - (Re‑use) `web/lib/analytics.ts`
- Tests: Unit test for persistence util and intercept logic (DOM event simulation).

### Step 6: Audit/fix `rel="noopener noreferrer"`
- Goal: Ensure all external links are safe.
- What we are doing: Double‑checking all external links use the right settings to prevent tab‑nabbing.
- Files to verify/modify (grep identified; expand if found):
  - `web/components/features/projects/project-card.tsx`
  - `web/app/projects/[id]/page.tsx`
  - `web/app/collaborations/[id]/page.tsx`
  - `web/components/features/projects/demo-embed.tsx`
  - `web/app/profile/page.tsx`
- Tests: Optional static check; manual verification acceptable given scope.

### Step 7: Documentation and changelog
- Goal: Keep specs and setup current.
- What we are doing: Updating docs to reflect new capabilities and any new environment variables.
- Files to modify:
  - `docs/MVP_TECH_SPEC.md`
  - `docs/SERVER_ACTIONS.md`
  - `docs/ARCHITECTURE.md`
  - `ops/ENVIRONMENT.md`
  - `CHANGELOG.md`
- Notes: Add `ERROR_SALT` env var; document report payload shape and limits.

## Acceptance Criteria

- Error pages
  - `web/app/error.tsx` and `web/app/not-found.tsx` exist and render clear guidance and actions.
  - 401/403/409/500 states display friendly, non‑leaky messages; 500 includes retry.

- Error reporting
  - POST `/api/errors/report` accepts payload, enriches, redacts, anonymizes user id, and responds `{ ok: true }` when within limits.
  - Rate limit enforced with friendly `{ error: 'rate_limited', retryAfterSec }` response.
  - Client reporter sends events on unhandled errors without crashing the app.

- External link disclaimer
  - First external link click shows a disclaimer with “Proceed” and “Don’t show again”.
  - Subsequent clicks (same browser) bypass disclaimer after opt‑out.
  - All external links use `rel="noopener noreferrer"`.

- Tests
  - Unit tests cover redaction and anonymization helpers.
  - Integration test covers report rate limiting.
  - Disclaimer persistence/util tests pass.

- Docs
  - Tech spec, server actions, architecture, environment, and changelog updated.

## Workflow

At each step in ‘Actionable and specific steps’, 
- Explain clearly on what you are doing and the rationale behind with layman's term, and add detailed explanation if technical term is used. 
- Inspect relevant code, documents, and ‘.cursorrules’ before making change.
- Code the changes, and make sure codes are robust, reusable and modular. 
- Identidy the files that the code would affect and prevent any bug.
- Add testcases for the change. Then, make sure all testcases are passed.
- After each atmoic change, guide user to review it
- After user's review and approval, push changes to Github 
- Do not forget to update progress tracking and other relevant documents.
- Proceed to the next step in ‘Actionable and specific steps’

Always follow this plan, refer back to this document, update the progress after each step is done, and modify it if needed.

## Progress Tracking

| Step | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| 1. Error pages | ✅ Completed | 16/9/2025 | 16/9/2025 | Added error.tsx and not-found.tsx + tests |
| 2. Report endpoint + helpers (incl. rate limit) | ✅ Completed | 16/9/2025 | 16/9/2025 | API + helpers + tests |
| 3. Client reporter | ✅ Completed | 16/9/2025 | 16/9/2025 | Global listeners + throttling |
| 4. Report problem page | ✅ Completed | 16/9/2025 | 16/9/2025 | Server action + page + tests |
| 5. External disclaimer | ✅ Completed | 16/9/2025 | 16/9/2025 | One-time modal + utils + tests |
| 6. noopener audit | ✅ Completed | 16/9/2025 | 16/9/2025 | Added static test to ensure rel present |
| 7. Docs + changelog | ✅ Completed | 16/9/2025 | 16/9/2025 | Updated tech spec, server actions, env, analytics, changelog |

## Risk Mitigation

- Privacy leakage: Apply regex‑based PII redaction and server‑side anonymization; never store raw emails or tokens.
- Noise and abuse: Enforce rate limits per user/IP, add basic size caps to messages, and drop oversized payloads.
- Runtime regressions: Keep the reporter lightweight and resilient; ignore errors within the reporter itself.
- UX annoyance: Persist “Don’t show again” to avoid repeated disclaimers; ensure ESC/Enter keyboard support.
- Security: Maintain `rel="noopener noreferrer"`; the disclaimer must not override user intent or hijack navigation.

---

**Last Updated:** 16/9/2025  
**Next Review:** N/A (Stage 13 complete)
