-- Stage 15: Logos for projects & collaborations + Profile avatars
-- Adds columns to store image paths and creates public-read storage buckets.

-- Columns (idempotent)
alter table if exists projects
  add column if not exists logo_path text;

alter table if exists collaborations
  add column if not exists logo_path text;

alter table if exists profiles
  add column if not exists avatar_path text;

-- Storage buckets (public-read); create only if missing
-- Note: Public-read buckets are used for rendering performance. Uploads use signed URLs from the server.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-logos') THEN
    PERFORM storage.create_bucket('project-logos', public => true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'collab-logos') THEN
    PERFORM storage.create_bucket('collab-logos', public => true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-avatars') THEN
    PERFORM storage.create_bucket('profile-avatars', public => true);
  END IF;
END$$;

-- App-level enforcement: file size ≤ 1MB; mime type in (image/png, image/jpeg, image/svg+xml)
-- Implemented in server actions when issuing signed upload URLs and when setting the path.
