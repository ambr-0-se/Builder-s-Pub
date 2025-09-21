-- Enable RLS and add owner-only policies for project_tags (join table)
-- Idempotent: safe to run multiple times

alter table if exists public.project_tags enable row level security;

-- Read: allow anyone to select
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'project_tags' and policyname = 'project_tags_select_public'
  ) then
    create policy project_tags_select_public
      on public.project_tags
      for select
      using (true);
  end if;
end$$;

-- Insert: only the project owner can attach tags to their project
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'project_tags' and policyname = 'project_tags_insert_owner'
  ) then
    create policy project_tags_insert_owner
      on public.project_tags
      for insert
      with check (
        exists (
          select 1 from public.projects p
          where p.id = project_tags.project_id
            and p.owner_id = auth.uid()
        )
      );
  end if;
end$$;

-- Delete: only the project owner can remove tags from their project
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'project_tags' and policyname = 'project_tags_delete_owner'
  ) then
    create policy project_tags_delete_owner
      on public.project_tags
      for delete
      using (
        exists (
          select 1 from public.projects p
          where p.id = project_tags.project_id
            and p.owner_id = auth.uid()
        )
      );
  end if;
end$$;


