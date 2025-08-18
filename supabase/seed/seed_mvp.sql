-- Purpose: Seed baseline technology/category tags for MVP; safe to run multiple times.
-- See also: ../docs/MVP_TECH_SPEC.md and ../supabase/schema.sql

insert into tags (name, type)
values
  ('LLM', 'technology'),
  ('NLP', 'technology'),
  ('Computer Vision', 'technology'),
  ('Agents', 'technology'),
  ('Education', 'category'),
  ('Finance', 'category'),
  ('Productivity', 'category'),
  ('Healthcare', 'category')
on conflict (name, type) do nothing;

-- Optionally add a sample collaboration post via the app once auth is configured.

