Non-Functional Requirements (MVP)

> Purpose: Sets performance, security, availability, accessibility, SEO, privacy, and migration requirements for the MVP.
> See also: [PRD](../Product%20Requirement%20Document.md) · [MVP Tech Spec](MVP_TECH_SPEC.md) · [Analytics](ANALYTICS.md) · [Schema overview](../supabase/schema.md)

Performance
- Landing and list pages: p95 TTFB < 300ms cached; list/data responses < 500ms for 20 items.
- Payload budgets: initial JS < 200KB gzip; CSS < 60KB gzip; images via CDN.
- Pagination: default 20, max 50. Prefer cursor for popular lists.

Security
- Mandatory Row-Level Security (RLS) for all user-generated tables.
- Input validation and output encoding to mitigate XSS/SQLi; allow-list URL protocols (http/https).
- Rate limits (per authenticated user): content creation (projects/collaborations) ≤ 5/day; comments/replies ≤ 5/min; upvote toggles ≤ 10/min. Anonymous: read-only.
- Secrets in env vars; no secrets committed. Use `.env.local`.

Availability & Observability
- Target 99.5% monthly availability for MVP.
- Centralized error logging with correlation ID; surface user-friendly messages.
- Basic health checks for frontend and backend.

Accessibility
- Keyboard navigable UI, focus states visible, form labels tied to inputs.
- Color contrast AA for text; alt text for images/media.

SEO
- Canonical URLs, sitemap.xml (implemented), robots.txt. OG tags for project pages.
- Add `robots.txt` with a `Sitemap: https://<domain>/sitemap.xml` reference (recommended).
- Descriptive titles/meta; friendly slugs where applicable.

Privacy
- Do not log PII in analytics. Respect DNT where feasible.
- Store only necessary profile data; allow deletion on request.

Internationalization
- Out of scope for MVP; design copy for easy future extraction.

Browser Support
- Evergreen browsers (Chrome/Edge/Firefox last 2), Safari ≥ 16.

Reliability & Migrations
- Backward-compatible DB changes; avoid breaking reads during deploys.
- Use transactional migrations; seed data idempotent.

