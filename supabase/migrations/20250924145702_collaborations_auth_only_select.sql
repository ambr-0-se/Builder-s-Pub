-- Stage 17: Collaboration visibility (auth-only)
-- Require authentication for SELECT on collaboration tables

-- Collaborations: select only when authenticated and not soft-deleted
alter table if exists collaborations enable row level security;
drop policy if exists collab_select_all on collaborations;
create policy collab_select_all on collaborations for select using (
  soft_deleted = false and auth.uid() is not null
);

-- Collaboration Tags (join table): select only when authenticated
alter table if exists collaboration_tags enable row level security;
drop policy if exists collaboration_tags_select_all on collaboration_tags;
create policy collaboration_tags_select_all on collaboration_tags for select using (
  auth.uid() is not null
);

-- Collaboration Upvotes: select only when authenticated
alter table if exists collaboration_upvotes enable row level security;
drop policy if exists collab_upvotes_select_all on collaboration_upvotes;
create policy collab_upvotes_select_all on collaboration_upvotes for select using (
  auth.uid() is not null
);

-- Collaboration Comments: select only when authenticated and not soft-deleted
alter table if exists collab_comments enable row level security;
drop policy if exists collab_comments_select_all on collab_comments;
create policy collab_comments_select_all on collab_comments for select using (
  soft_deleted = false and auth.uid() is not null
);

-- Collaboration Roles (role index for search): select only when authenticated
alter table if exists collaboration_roles enable row level security;
drop policy if exists collaboration_roles_select_all on collaboration_roles;
create policy collaboration_roles_select_all on collaboration_roles for select using (
  auth.uid() is not null
);

-- Roles Catalog remains public select (no change here)


