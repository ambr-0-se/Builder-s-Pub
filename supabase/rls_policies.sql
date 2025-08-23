-- Purpose: Defines Row-Level Security policies for all MVP tables.
-- See also: schema.sql and ../docs/MVP_TECH_SPEC.md

-- Profiles
alter table profiles enable row level security;

drop policy if exists profiles_select_all on profiles;
create policy profiles_select_all on profiles for select using (true);

drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles for insert with check (auth.uid() = user_id);

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update using (auth.uid() = user_id);

-- Projects
alter table projects enable row level security;

drop policy if exists projects_select_all on projects;
create policy projects_select_all on projects for select using (soft_deleted = false);

drop policy if exists projects_insert_own on projects;
create policy projects_insert_own on projects for insert with check (auth.uid() = owner_id);

drop policy if exists projects_update_own on projects;
create policy projects_update_own on projects for update using (auth.uid() = owner_id);

drop policy if exists projects_delete_own on projects;
create policy projects_delete_own on projects for delete using (auth.uid() = owner_id);

-- Comments
alter table comments enable row level security;

drop policy if exists comments_select_all on comments;
create policy comments_select_all on comments for select using (soft_deleted = false);

drop policy if exists comments_insert_auth on comments;
create policy comments_insert_auth on comments for insert with check (auth.uid() = author_id);

drop policy if exists comments_delete_own on comments;
create policy comments_delete_own on comments for delete using (auth.uid() = author_id);

-- Comment Upvotes
alter table if exists comment_upvotes enable row level security;

drop policy if exists comment_upvotes_select_all on comment_upvotes;
create policy comment_upvotes_select_all on comment_upvotes for select using (true);

drop policy if exists comment_upvotes_insert_auth on comment_upvotes;
create policy comment_upvotes_insert_auth on comment_upvotes for insert with check (auth.uid() = user_id);

drop policy if exists comment_upvotes_delete_own on comment_upvotes;
create policy comment_upvotes_delete_own on comment_upvotes for delete using (auth.uid() = user_id);

-- Tags (read-only for public; writes remain admin-only via service role or dashboard)
alter table tags enable row level security;

drop policy if exists tags_select_all on tags;
create policy tags_select_all on tags for select using (true);

-- Project Upvotes
alter table project_upvotes enable row level security;

drop policy if exists upvotes_select_all on project_upvotes;
create policy upvotes_select_all on project_upvotes for select using (true);

drop policy if exists upvotes_insert_auth on project_upvotes;
create policy upvotes_insert_auth on project_upvotes for insert with check (auth.uid() = user_id);

drop policy if exists upvotes_delete_own on project_upvotes;
create policy upvotes_delete_own on project_upvotes for delete using (auth.uid() = user_id);

-- Rate limits (per-user counters for throttling)
alter table if exists rate_limits enable row level security;

drop policy if exists rate_limits_select_own on rate_limits;
create policy rate_limits_select_own on rate_limits for select using (auth.uid() = user_id);

drop policy if exists rate_limits_insert_own on rate_limits;
create policy rate_limits_insert_own on rate_limits for insert with check (auth.uid() = user_id);

drop policy if exists rate_limits_update_own on rate_limits;
create policy rate_limits_update_own on rate_limits for update using (auth.uid() = user_id);

-- Collaborations
alter table collaborations enable row level security;

drop policy if exists collab_select_all on collaborations;
create policy collab_select_all on collaborations for select using (soft_deleted = false);

drop policy if exists collab_insert_own on collaborations;
create policy collab_insert_own on collaborations for insert with check (auth.uid() = owner_id);

drop policy if exists collab_update_own on collaborations;
create policy collab_update_own on collaborations for update using (auth.uid() = owner_id);

drop policy if exists collab_delete_own on collaborations;
create policy collab_delete_own on collaborations for delete using (auth.uid() = owner_id);

