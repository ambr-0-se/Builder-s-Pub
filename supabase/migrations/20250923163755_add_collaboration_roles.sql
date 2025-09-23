-- Stage 16: Add collaboration_roles join table for role search and indexing (replaces earlier draft)
-- Filename follows HK time: 20250923163755

create extension if not exists pg_trgm;

create table if not exists collaboration_roles (
  collaboration_id uuid not null references collaborations(id) on delete cascade,
  role text not null check (char_length(role) <= 80)
);

create unique index if not exists uq_collab_roles_ci
  on collaboration_roles (collaboration_id, lower(role));

create index if not exists idx_collab_roles_role_trgm
  on collaboration_roles using gin (lower(role) gin_trgm_ops);


