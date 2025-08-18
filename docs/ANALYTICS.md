Analytics Plan (MVP)

> Purpose: Defines minimal, high-signal events, properties, funnels, and instrumentation guidance; excludes PII.
> See also: [PRD](../Product%20Requirement%20Document.md) · [MVP Tech Spec](MVP_TECH_SPEC.md) · [NFR](NFR.md)

Purpose
Measure activation, engagement, and discovery for the MVP. Keep events minimal and high-signal.

Tooling
- PostHog (recommended) or equivalent. Client + server events with consistent naming.

Event Naming
- snake_case for event names; lowerCamelCase for properties.

Core Events
- signup
- profile_update
- project_create
- project_view
- upvote_click
- comment_create
- collab_create
- search_performed
- filter_apply

Event Properties (by context)
- Common: userId (anon or authed), sessionId, ts
- project_*: projectId, techTags, categoryTags
- search/filter: query, techTagIds, categoryTagIds, resultCount
- collab_*: collabId, kind

Funnels
- New user: signup -> profile_update -> project_create
- Viewer: project_view -> upvote_click | comment_create

Implementation Notes
- Fire `project_view` on detail page mount (debounced 1s).
- Derive trending with upvotes and recency in backend; no client-side ranking.
- Respect user privacy; do not log PII in event properties.

