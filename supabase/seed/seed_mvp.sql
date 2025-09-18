-- Purpose: Seed baseline technology/category tags for MVP; safe to run multiple times.
-- See also: ../docs/MVP_TECH_SPEC.md and ../supabase/schema.sql

insert into tags (name, type)
values
  ('LLM', 'technology'),
  ('NLP', 'technology'),
  ('Computer Vision', 'technology'),
  ('Agents', 'technology'),
  --('Education', 'category'), (deleted)
  ('Finance', 'category'),
  ('Productivity', 'category'),
  ('Healthcare', 'category')
on conflict (name, type) do nothing;

-- Stage 14 curation: additional technology/category tags (idempotent)
insert into tags (name, type)
values
  -- Technology (additions)
  ('RAG', 'technology'),
  ('Multimodal', 'technology'),
  ('Speech', 'technology'),
  ('Traditional ML', 'technology'),
  ('Data Science', 'technology'),
  ('Data Analytics', 'technology'),
  ('Model Training', 'technology'),
  ('Fine-tuning', 'technology'),
  ('MLOps', 'technology'),
  ('Vibe Coding', 'technology'),
  ('On-device AI (Edge AI)', 'technology'),
  ('Embedded/IoT', 'technology'),
  ('Brain-Computer Interface (BCI)', 'technology'),
  ('Others', 'technology'),

  -- Category (additions)
  ('Developer Tools', 'category'),
  ('Social', 'category'),
  ('Content/Media', 'category'),
  ('Research', 'category'),
  ('Sports', 'category'),
  ('Marketing', 'category'),
  ('Business/Management', 'category'),
  ('Computer Science', 'category'),
  ('Science', 'category'),
  ('Mental Health & Psychology', 'category'),
  ('Economics', 'category'),
  ('Engineering', 'category'),
  ('Web3/Crypto', 'category'),
  ('Design', 'category'),
  ('Architecture', 'category'),
  ('Travel', 'category'),
  ('Health & Fitness', 'category'),
  ('Education/ Study tools', 'category'),
  ('Hardware & IoT', 'category'),
  ('Others', 'category')
on conflict (name, type) do nothing;

-- Optionally add a sample collaboration post via the app once auth is configured.

