Analytics Plan (MVP)

> Purpose: Defines minimal, high-signal events, properties, funnels, and instrumentation guidance; excludes PII.
> See also: [PRD](../Product%20Requirement%20Document.md) · [MVP Tech Spec](MVP_TECH_SPEC.md) · [NFR](NFR.md)

Purpose
Measure activation, engagement, and discovery for the MVP. Keep events minimal and high-signal.

Tooling
- PostHog (recommended) or equivalent. Client + server events with consistent naming.
- MVP mock: `useAnalyticsMock()` currently emits logs from server actions to the server terminal (the shell running `pnpm dev`), not the browser console.

Event Naming
- snake_case for event names; lowerCamelCase for properties.

Core Events
- signup
- profile_update
- project_create
- project_view
- upvote_toggled
- comment_added
- comment_deleted
- reply_added
- collab_create
- search_performed
- filter_apply
- external_link_disclaimer_shown
- external_link_proceed
- search_mode_change

Event Properties (by context)
- Common: userId (anon or authed), sessionId, ts
- project_*: projectId, techTags, categoryTags
- comments: commentId, parentCommentId?, projectId
- upvote_toggled: target (project|comment|collaboration), targetId, upvoted (boolean), limited? (boolean), retryAfterSec?
- search_performed: 
  - type ('projects'|'collabs')
  - search_mode ('project'|'role')
  - query (string)
  - role? (string; present when search_mode='role')
  - techTagIds (number[])
  - categoryTagIds (number[])
  - stages? (string[]; collabs only)
  - projectTypes? (string[]; collabs only)
  - resultCount (number)
- filter_apply (unified schema):
  - type: 'projects'|'collabs'
  - search_mode ('project'|'role')
  - techTagIds: number[]
  - categoryTagIds: number[]
  - stages?: string[] (collabs only)
  - projectTypes?: string[] (collabs only)
  - triggeredBy?: 'filters'
- search_mode_change:
  - type: 'collabs'
  - from: 'project'|'role'
  - to: 'project'|'role'
  - techTagIds: number[]
  - categoryTagIds: number[]
  - stages?: string[]
  - projectTypes?: string[]
- collab_*: collabId, kind

Funnels
- New user: signup -> profile_update -> project_create
- Viewer: project_view -> upvote_click | comment_create

Implementation Notes
- Fire `project_view` on detail page mount (debounced 1s).
- Server actions emit events:
  - comment_added/comment_deleted/reply_added
  - upvote_toggled (project|comment) with upvoted, limited?, retryAfterSec?
- Derive trending with upvotes and recency in backend; no client-side ranking.
- Respect user privacy; do not log PII in event properties.
- External links: the disclaimer component emits `external_link_disclaimer_shown` and `external_link_proceed` with `{ href, host }` (no PII). The click itself opens with `noopener,noreferrer`.

Verification (MVP mock)
- Open the terminal running `pnpm dev` to see lines prefixed with `[Analytics]` when you add/delete comments, add replies, or toggle upvotes.
- Browser DevTools will not show these mock logs unless additional client-side mirroring is added.

Configuration & Verification (PostHog)

Purpose: Enable real analytics capture via PostHog, while preserving a safe no‑op path when keys are missing.

Environment variables
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog project API key (public). If unset or empty, analytics is disabled (no‑op).
- `NEXT_PUBLIC_POSTHOG_HOST`: Optional; defaults to `https://us.posthog.com`.

Enable locally
1) Create a PostHog project (Cloud or self‑hosted).
2) Copy the project API key.
3) Add to `web/.env.local`:
   - `NEXT_PUBLIC_POSTHOG_KEY=<your_project_key>`
   - `NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com` (or your region/self‑host URL)
4) Restart dev server: `cd web && pnpm dev`.

Client vs Server scope (MVP)
- Client events (e.g., `project_view`, `search_performed`, `filter_apply`) are sent via `posthog-js` when enabled.
- Server events are currently structured logs via `trackServer(...)` (not sent to PostHog yet). This avoids leaking server credentials; a server provider can be added post‑MVP if needed.

Manual verification checklist
1) Open the site in the browser with DevTools → Network.
2) Interact to trigger client events:
   - Project view: open a project detail page; after ~1s, expect a request to PostHog (`/e/` endpoint) and the event `project_view` in the dashboard’s Live Events.
   - Apply filters on `/projects`: expect `filter_apply` (normalized from legacy `filters_applied`).
   - Perform a search on `/collaborations` in both modes: expect `search_performed` with properties (`search_mode` and `role` when in role mode).
   - Toggle mode on `/collaborations`: expect `search_mode_change` with from/to and current facet arrays.
3) Check PostHog → Events/Live: confirm events appear with expected properties (no PII).
4) Server events: check terminal running `pnpm dev` for `[Analytics][server] ...` lines:
   - `project_create` after successful create.
   - `signup` on first profile ensure.
   - `profile_update` after saving profile.

Troubleshooting
- Ad blockers/Tracking Protection can block PostHog endpoints. Disable for local testing.
- Ensure `NEXT_PUBLIC_POSTHOG_KEY` is set and server restarted.
- Region mismatch: set `NEXT_PUBLIC_POSTHOG_HOST` to your PostHog project region.
- Debounce: `project_view` emits after 1s; wait before navigating away.

Privacy
- We do not send PII; properties contain ids and context only.
- If the key is missing, analytics is a safe no‑op (no runtime errors).

