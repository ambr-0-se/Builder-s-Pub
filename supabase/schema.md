Schema Overview (MVP)

> Purpose: Human-readable database overview — tables, relationships, indexes, and RLS summary for the MVP.
> See also: [Schema SQL](schema.sql) · [RLS policies](rls_policies.sql) · [MVP Tech Spec](../docs/MVP_TECH_SPEC.md) · [Server Actions](../docs/SERVER_ACTIONS.md) · [Auth](../docs/AUTH.md)

Tables
- profiles(user_id PK, display_name, bio, github_url, linkedin_url, website_url, created_at, updated_at)
- projects(id PK, owner_id FK, title, tagline, description, demo_url, source_url, soft_deleted, created_at, updated_at)
- tags(id PK, name, type[technology|category])
- project_tags(project_id FK, tag_id FK) — PK(project_id, tag_id)
- comments(id PK, project_id FK, author_id FK, body, soft_deleted, created_at)
- project_upvotes(project_id FK, user_id FK, created_at) — PK(project_id, user_id)
- collaborations(id PK, owner_id FK, kind, title, description, skills[], region, commitment, soft_deleted, created_at)

Relationships
- profiles 1:1 auth.users
- projects M:1 profiles/auth.users (owner)
- projects M:N tags via project_tags
- comments M:1 projects and M:1 profiles/auth.users
- project_upvotes M:1 projects and M:1 profiles/auth.users
- collaborations M:1 profiles/auth.users

Indexes (key)
- projects(created_at desc), lower(title), lower(description)
- project_upvotes(project_id)
- comments(project_id, created_at desc)
- tags(type, name)
- project_tags(tag_id, project_id)

RLS Summary
- profiles: select all; insert/update only self
 - tags: select all (read-only in MVP; writes via admin/service role)

Notes (Stage 3 Profiles)
- Profiles are auto-created at first sign-in by an app endpoint `/api/profile/ensure` called from `/auth/callback`.
- This keeps schema unchanged (no DB triggers) and respects RLS by performing writes under the authenticated user session.
- projects: select soft_deleted=false; insert/update/delete only owner
- comments: select soft_deleted=false; insert only author; delete only author
- project_upvotes: select all; insert/delete only same user
- collaborations: select soft_deleted=false; insert/update/delete only owner

