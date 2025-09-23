Migration naming convention

Use timestamped, snake_case file names with second-level precision:

- Format: `YYYYMMDDHHMMSS_description.sql`
- Example: `20250922090000_enable_rls_project_tags.sql`

Guidelines
- `YYYYMMDDHHMMSS` refers to the EXACT CURRENT year, month, date, hour, minute, second in Hong Kong Time (run the command `TZ=Asia/Hong_Kong date +%Y%m%d%H%M%S` to get it)
- One logical change per migration; keep it small and idempotent where possible.
- Prefer idempotent SQL (IF NOT EXISTS, OR REPLACE, DO $$ ... $$ guards) to support re-runs.
- Avoid destructive changes unless explicitly intended and documented.
- Keep policies mirrored in `supabase/rls_policies.sql` for a readable snapshot; ship real changes via migrations.

Apply order
- Migrations run lexicographically; the leading timestamp ensures correct sequencing.

