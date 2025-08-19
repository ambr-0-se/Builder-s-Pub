-- Purpose: Seed relational data tied to TWO real Supabase auth users so you can verify RLS behaviors.
-- Prereqs: Run schema.sql and rls_policies.sql, and run seed_mvp.sql to create baseline tags.
-- How to use:
-- 1) In Supabase Dashboard → Auth → Users, copy the UUIDs of two test users (they can be newly created).
-- 2) Replace the placeholders USER1_UUID and USER2_UUID below with those UUIDs.
-- 3) Run this entire script in the SQL Editor. It is idempotent.

begin;

-- Replace these with real UUIDs from Auth → Users
with users as (
  select 'd77d8ba8-8e5d-4c28-9c2e-d7fddee9999e'::uuid as user1_id, '8856c26b-7e00-457c-b457-7ff85a4be51f'::uuid as user2_id
),
ensure_profiles as (
  -- Ensure both profiles exist (idempotent)
  insert into profiles (user_id, display_name, bio, github_url)
  select user1_id, 'Alex Chen', 'Full-stack developer', 'https://github.com/alexchen' from users
  on conflict (user_id) do update set display_name = excluded.display_name
  returning user_id
), ensure_profiles_2 as (
  insert into profiles (user_id, display_name, bio)
  select user2_id, 'Sarah Kim', 'Student developer' from users
  on conflict (user_id) do update set display_name = excluded.display_name
  returning user_id
),
p1 as (
  -- Project owned by user1
  insert into projects (owner_id, title, tagline, description, demo_url, source_url)
  select user1_id,
         'AI Code Review Assistant',
         'Automated code review with AI',
         'Analyzes PRs and suggests improvements using LLMs.',
         'https://demo.example.com',
         'https://github.com/example/ai-code-review'
  from users
  on conflict do nothing
  returning id
),
p2 as (
  -- Project owned by user2
  insert into projects (owner_id, title, tagline, description, demo_url)
  select user2_id,
         'Smart Study Planner',
         'AI-powered study schedule optimizer',
         'Optimizes study schedules based on patterns and deadlines.',
         'https://study-planner.example.com'
  from users
  on conflict do nothing
  returning id
),
-- Tag associations for p1
tag_p1a as (
  insert into project_tags (project_id, tag_id)
  select p1.id, t.id from p1 join tags t on t.name='LLM' and t.type='technology'
  on conflict do nothing
  returning project_id
), tag_p1b as (
  insert into project_tags (project_id, tag_id)
  select p1.id, t.id from p1 join tags t on t.name='Productivity' and t.type='category'
  on conflict do nothing
  returning project_id
),
-- Tag associations for p2
tag_p2a as (
  insert into project_tags (project_id, tag_id)
  select p2.id, t.id from p2 join tags t on t.name='NLP' and t.type='technology'
  on conflict do nothing
  returning project_id
), tag_p2b as (
  insert into project_tags (project_id, tag_id)
  select p2.id, t.id from p2 join tags t on t.name='Education' and t.type='category'
  on conflict do nothing
  returning project_id
),
c1 as (
  -- Comment by user2 on project p1
  insert into comments (project_id, author_id, body)
  select p1.id, u.user2_id, 'Great idea! Would love to see diff-level insights.'
  from p1, users u
  on conflict do nothing
  returning id
),
uv1 as (
  -- Upvote by user1 on project p2
  insert into project_upvotes (project_id, user_id)
  select p2.id, u.user1_id from p2, users u
  on conflict do nothing
  returning project_id
),
col1 as (
  -- Collaboration owned by user1
  insert into collaborations (owner_id, kind, title, description, skills, region, commitment)
  select u.user1_id,
         'ongoing',
         'AI-Powered Learning Platform',
         'Seeking frontend developers to build an adaptive learning platform.',
         array['React','TypeScript','UI/UX Design'],
         'Remote',
         'Part-time (10-15 hours/week)'
  from users u
  on conflict do nothing
  returning id
),
soft_deleted_sample as (
  -- A soft-deleted project (should not appear in selects under RLS)
  insert into projects (owner_id, title, tagline, description, demo_url, soft_deleted)
  select user1_id,
         'Deleted Draft Project',
         'Will not be visible',
         'Soft-deleted for RLS verification',
         'https://hidden.example.com',
         true
  from users
  on conflict do nothing
  returning id
)
select 1;

commit;

-- Verification helpers (run separately as needed):
-- 1) Ensure tags exist (if empty, run seed_mvp.sql first)
--    select * from tags order by type, name;
-- 2) Check projects created
--    select id, title, owner_id, soft_deleted from projects order by created_at desc;
-- 3) Check comments and upvotes
--    select * from comments order by created_at desc;
--    select * from project_upvotes;
-- 4) Check collaborations
--    select * from collaborations order by created_at desc;

