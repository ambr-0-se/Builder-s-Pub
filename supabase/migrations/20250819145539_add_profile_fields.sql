-- Add columns (safe to run multiple times)
alter table profiles add column if not exists x_url text;
alter table profiles add column if not exists region text;
alter table profiles add column if not exists timezone text;
alter table profiles add column if not exists skills text[];
alter table profiles add column if not exists building_now text;
alter table profiles add column if not exists looking_for text;
alter table profiles add column if not exists contact text;

-- Hard limits (length checks) with validation; created once
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_building_now_len') then
    alter table profiles
      add constraint profiles_building_now_len
      check (building_now is null or char_length(building_now) <= 280) not valid;
    alter table profiles validate constraint profiles_building_now_len;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_looking_for_len') then
    alter table profiles
      add constraint profiles_looking_for_len
      check (looking_for is null or char_length(looking_for) <= 280) not valid;
    alter table profiles validate constraint profiles_looking_for_len;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_contact_len') then
    alter table profiles
      add constraint profiles_contact_len
      check (contact is null or char_length(contact) <= 200) not valid;
    alter table profiles validate constraint profiles_contact_len;
  end if;
end$$;

-- Optional indexes (uncomment if you plan to filter soon)
-- create index if not exists idx_profiles_region_lower on profiles (lower(region));
-- create index if not exists idx_profiles_skills_gin on profiles using gin (skills);