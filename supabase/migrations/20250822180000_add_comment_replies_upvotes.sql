-- Stage 6 extension: comment replies (1 level) and comment upvotes, plus simple rate limit storage

-- Replies: add parent_comment_id for 1-level threading
alter table comments
  add column if not exists parent_comment_id uuid references comments(id) on delete cascade;

create index if not exists idx_comments_parent_created on comments (parent_comment_id, created_at asc);

-- Comment upvotes: 1 per user; allow delete for unvote
create table if not exists comment_upvotes (
  comment_id uuid references comments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists idx_comment_upvotes_comment on comment_upvotes (comment_id);

-- Simple per-user rate limit window (server-enforced)
create table if not exists rate_limits (
  action text not null,
  user_id uuid not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (action, user_id, window_start)
);


