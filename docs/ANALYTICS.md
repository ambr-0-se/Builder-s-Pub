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

Event Properties (by context)
- Common: userId (anon or authed), sessionId, ts
- project_*: projectId, techTags, categoryTags
- comments: commentId, parentCommentId?, projectId
- upvote_toggled: target (project|comment), targetId, upvoted (boolean), limited? (boolean), retryAfterSec?
- search/filter: query, techTagIds, categoryTagIds, resultCount
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

Verification (MVP mock)
- Open the terminal running `pnpm dev` to see lines prefixed with `[Analytics]` when you add/delete comments, add replies, or toggle upvotes.
- Browser DevTools will not show these mock logs unless additional client-side mirroring is added.

