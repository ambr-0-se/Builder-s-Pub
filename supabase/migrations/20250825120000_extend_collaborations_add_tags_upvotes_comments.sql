-- Stage 8: Collaboration board — extended schema

-- 1) Extend collaborations with additional fields
alter table if exists collaborations
  add column if not exists affiliated_org text,
  add column if not exists project_type text,
  add column if not exists stage text,
  add column if not exists looking_for jsonb not null default '[]'::jsonb,
  add column if not exists contact text,
  add column if not exists remarks text;

-- Project type and stage validations (allow NULL but restrict values when present)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'collaborations_project_type_valid'
  ) then
    alter table collaborations add constraint collaborations_project_type_valid
      check (
        project_type is null or project_type in (
          'personal','open_source','research','startup_idea_validation','startup_registered',
          'student_organization','university','ngo','corporate','others'
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'collaborations_stage_valid'
  ) then
    alter table collaborations add constraint collaborations_stage_valid
      check (
        stage is null or stage in (
          'ideation','planning','requirements_analysis','design','mvp_development',
          'testing_validation','implementation_deployment','monitoring_maintenance',
          'evaluation_closure','scaling','adding_features'
        )
      );
  end if;
end $$;

-- Helpful created_at index (if missing)
create index if not exists idx_collaborations_created_at on collaborations (created_at desc);

-- 2) Collaboration ↔ Tags (many-to-many)
create table if not exists collaboration_tags (
  collaboration_id uuid references collaborations(id) on delete cascade,
  tag_id int references tags(id) on delete cascade,
  primary key (collaboration_id, tag_id)
);

create index if not exists idx_collaboration_tags_tag on collaboration_tags (tag_id, collaboration_id);

-- 3) Collaboration upvotes (1 per user per collaboration)
create table if not exists collaboration_upvotes (
  collaboration_id uuid references collaborations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collaboration_id, user_id)
);

create index if not exists idx_collaboration_upvotes_collab on collaboration_upvotes (collaboration_id);

-- 4) Collaboration comments (top-level only for MVP)
create table if not exists collab_comments (
  id uuid primary key default gen_random_uuid(),
  collaboration_id uuid references collaborations(id) on delete cascade,
  author_id uuid references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  soft_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_collab_comments_collab_created on collab_comments (collaboration_id, created_at desc);


