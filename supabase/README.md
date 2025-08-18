Supabase Setup (MVP)

> Purpose: How to apply the schema/RLS and seed data, and configure Supabase auth for local and prod.
> See also: [Schema SQL](schema.sql) · [RLS policies](rls_policies.sql) · [Seed](seed/seed_mvp.sql) · [Environment](../ops/ENVIRONMENT.md)

1) Create a Supabase project and obtain `SUPABASE_URL` and keys.

2) Apply schema
- Open SQL editor and run `schema.sql`.
- Then run `rls_policies.sql`.

3) Seed data (optional)
- Run `seed/seed_mvp.sql` to create baseline tags.

4) Configure Auth
- Enable Email (magic link) authentication in Authentication -> Providers.
- Set Redirect URLs for local and production.

5) Storage (optional for MVP)
- Create a public bucket if you plan to host images or demos later.

Notes
- RLS is enabled; verify read/write operations work via SQL editor or app.
- Keep service role key on server only; never expose to client.

