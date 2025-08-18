-- Purpose: Canonical SQL for the MVP schema (tables, constraints, indexes) to be applied to Supabase.
-- See also: ../docs/MVP_TECH_SPEC.md and rls_policies.sql

create extension if not exists pgcrypto;

-- Profiles
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  bio text,
  github_url text,
  linkedin_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 80),
  tagline text not null check (char_length(tagline) <= 140),
  description text not null check (char_length(description) <= 4000),
  demo_url text not null,
  source_url text,
  soft_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tags
create table if not exists tags (
  id serial primary key,
  name text not null,
  type text not null check (type in ('technology','category')),
  created_at timestamptz not null default now(),
  unique (name, type)
);

-- Project Tags (many-to-many)
create table if not exists project_tags (
  project_id uuid references projects(id) on delete cascade,
  tag_id int references tags(id) on delete cascade,
  primary key (project_id, tag_id)
);

-- Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  author_id uuid references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  soft_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

-- Project Upvotes (1 per user per project)
create table if not exists project_upvotes (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- Collaborations
create table if not exists collaborations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('ongoing','planned','individual','organization')),
  title text not null check (char_length(title) <= 120),
  description text not null check (char_length(description) <= 4000),
  skills text[],
  region text,
  commitment text,
  soft_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_projects_created_at on projects (created_at desc);
create index if not exists idx_projects_owner on projects (owner_id);
create index if not exists idx_comments_project on comments (project_id, created_at desc);
create index if not exists idx_upvotes_project on project_upvotes (project_id);
create index if not exists idx_tags_type_name on tags (type, name);
create index if not exists idx_project_tags_tag on project_tags (tag_id, project_id);

-- Basic search support (case-insensitive)
create index if not exists idx_projects_title_lower on projects (lower(title));
create index if not exists idx_projects_description_lower on projects (lower(description));

