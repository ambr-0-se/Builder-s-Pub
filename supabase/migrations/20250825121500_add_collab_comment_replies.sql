-- Add 1-level reply support for collaboration comments

alter table if exists collab_comments
  add column if not exists parent_comment_id uuid references collab_comments(id) on delete cascade;

create index if not exists idx_collab_comments_parent_created on collab_comments (parent_comment_id, created_at asc);



