-- Stage 16: roles_catalog table for curated role suggestions
-- Filename follows HK time: 20250923164504

create table if not exists roles_catalog (
  id serial primary key,
  name text not null unique
);

-- Case-insensitive uniqueness to avoid duplicates by casing
create unique index if not exists uq_roles_lower_name
  on roles_catalog (lower(name));

-- Seed curated roles (alphabetical)
insert into roles_catalog (name) values
  ('AI Engineer'),
  ('Agent Engineer'),
  ('Backend Engineer'),
  ('Business Analyst'),
  ('Business Development'),
  ('Co-founder'),
  ('Community Manager'),
  ('Content Creator'),
  ('Data Analyst'),
  ('Data Engineer'),
  ('Data Labeler/ Annotator'),
  ('Data Scientist'),
  ('DevOps Engineer'),
  ('Digital Marketer'),
  ('Frontend Engineer'),
  ('Full-stack Engineer'),
  ('Growth Marketer'),
  ('LLM Engineer'),
  ('Machine Learning Engineer'),
  ('MLOps Engineer'),
  ('Mobile Engineer'),
  ('Operations Manager'),
  ('Platform Engineer'),
  ('Product Designer'),
  ('Product/ Project Manager'),
  ('Prompt Engineer'),
  ('QA Engineer'),
  ('Research Engineer'),
  ('Research Scientist'),
  ('Security Engineer'),
  ('Site Reliability Engineer'),
  ('Social Media Manager'),
  ('Software Engineer'),
  ('Technical Writer'),
  ('UI/UX Designer'),
  ('Vibe-coding Cleanup Specialist')
on conflict (name) do nothing;


