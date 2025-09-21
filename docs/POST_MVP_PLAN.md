# Post‑MVP Plan

Purpose: Staged enhancements after MVP stabilizes. Each stage has clear scope and acceptance criteria. Follow Conventional Commits and update CHANGELOG for user-visible changes.

## Stage P1 — UI design uplift (timeboxed)
- Scope: visual polish on cards/lists, form spacing/typography, consistent empty states.
- AC: No layout regressions; Lighthouse ≥ 90 accessibility; diff confined to UI components and tokens.

## Stage P2 — Rich media uploads (images gallery)
- Scope: multiple images per project/collab; reorder; captions.
- Approach: Signed uploads to `media` bucket; 1600px max dimension; WebP conversion; EXIF strip.
- AC: Owners add/remove/reorder images; list shows first image; detail shows gallery; RLS tests present.

## Stage P3 — Video support (embeds first, native later)
- Scope: YouTube/Vimeo embeds with safe allowlist; optional timestamp.
- AC: Validated URLs render; malicious domains blocked; analytics event emitted.

## Stage P4 — About us (Goal, Vision, Team)
- Scope: marketing content with CMS‑ready structure.
- AC: SEO metadata; link in footer; < 2s LCP on mobile.

## Stage P5 — Error ops enhancements
- Scope: dashboards, on‑call alerts, sample filters, release health.
- AC: Error budgets/alerts configured; weekly digest; redaction verified.

## Stage P6 — Advanced tags
- Scope: synonyms/aliases, suggestions, trending.
- AC: Searching “JS” returns “JavaScript”; admin can set aliases; trending tag list visible.
