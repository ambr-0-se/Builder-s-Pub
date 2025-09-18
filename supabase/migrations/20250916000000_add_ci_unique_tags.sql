-- Stage 14: Enforce case-insensitive uniqueness for tags (type, lower(name))
-- Safe to run multiple times using IF NOT EXISTS semantics in create index

do $$ begin
  perform 1 from pg_indexes where schemaname = 'public' and indexname = 'uq_tags_type_lower_name';
  if not found then
    execute 'create unique index uq_tags_type_lower_name on public.tags (type, lower(name))';
  end if;
end $$;


