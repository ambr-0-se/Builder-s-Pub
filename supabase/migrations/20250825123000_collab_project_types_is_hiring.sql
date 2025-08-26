-- Add multi project types and hiring state to collaborations

alter table if exists collaborations
  add column if not exists project_types text[],
  add column if not exists is_hiring boolean not null default true;

-- Backfill project_types from legacy project_type if present
update collaborations
set project_types = array[project_type]
where project_types is null and project_type is not null;

-- Helpful partial index to list open roles fast
create index if not exists idx_collaborations_is_hiring on collaborations (is_hiring) where is_hiring = true;


