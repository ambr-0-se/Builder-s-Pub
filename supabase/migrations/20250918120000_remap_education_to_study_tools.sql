-- Purpose: Remap category tag 'Education' to 'Education/ Study tools' and delete the old tag.
-- Notes:
-- - Idempotent: safe to run multiple times.
-- - Seeds should no longer include ('Education','category') to avoid re-introducing the old tag.

-- 1) Ensure target tag exists
insert into tags (name, type) values ('Education/ Study tools', 'category')
on conflict (name, type) do nothing;

-- 2) Remap references from 'Education' -> 'Education/ Study tools' and delete old tag
do $$
declare
  old_id int;
  new_id int;
begin
  select id into old_id from tags where type = 'category' and lower(name) = 'education';
  select id into new_id from tags where type = 'category' and name = 'Education/ Study tools';

  if old_id is null then
    -- Nothing to do
    return;
  end if;
  if new_id is null then
    raise exception 'Target tag Education/ Study tools missing';
  end if;

  -- De-duplicate to avoid (project_id, tag_id) PK conflicts
  delete from project_tags pt
  using project_tags dup
  where pt.project_id = dup.project_id
    and pt.tag_id = old_id
    and dup.tag_id = new_id;

  -- Remap project tag links
  update project_tags
  set tag_id = new_id
  where tag_id = old_id;

  -- If collaboration_tags exists in your project, you can enable analogous steps:
  -- delete from collaboration_tags ct using collaboration_tags dup
  -- where ct.collaboration_id = dup.collaboration_id
  --   and ct.tag_id = old_id
  --   and dup.tag_id = new_id;
  -- update collaboration_tags set tag_id = new_id where tag_id = old_id;

  -- Remove the old tag
  delete from tags where id = old_id;
end $$;


