Authentication (Stage 2)

Purpose: Describe current auth flows, required settings, and integration points.

Flows
- Email Magic Link
  - Sign in at `/auth/sign-in` using email
  - Supabase sends a magic link to the user
  - After submit, the app routes to `/auth/check-email?email=...&redirectTo=...` to confirm the link is sent
  - The link returns to `/auth/callback` and completes the session
  - We support both styles of Supabase responses:
    - PKCE `?code=...` → handled by `exchangeCodeForSession`
    - Token hash `#access_token=...&refresh_token=...` → handled by `setSession`

Key Files
- Client: `web/lib/supabaseClient.ts` — Supabase browser client
- Hook: `web/lib/api/auth.ts` — `useAuth()` with `signIn(email, { redirectTo })` and `signOut()`
- Pages: `web/app/auth/sign-in/page.tsx`, `web/app/auth/callback/page.tsx`

Environment & Provider Setup
- Required env vars (client): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase Dashboard → Auth → URL Configuration:
  - Site URL: `http://localhost:3002`
  - Additional Redirect URLs: `http://localhost:3002/auth/callback`
- Provider: Auth → Providers → Email (magic links)

Multi-Tab Behavior
- We set `multiTab: false` to avoid cross-tab token refresh conflicts during development.

Redirects
- `useAuth().signIn(_, { redirectTo })` appends a `?redirectTo=...` query which the callback uses to send users back.

References
- Tech Spec: `docs/MVP_TECH_SPEC.md`
- Env setup: `ops/ENVIRONMENT.md`

Cookie sync for server actions (Profiles)
- After the callback sets the session, the app calls `/api/profile/ensure`.
- If the server hasn’t seen the auth cookies yet (fresh sign-in), the callback also sends the `access_token` and `refresh_token` once so the server can set the cookie via `supabase.auth.setSession(...)`.
- This ensures `getServerSupabase()` sees the authenticated user immediately, enabling RLS-protected profile reads/writes on the next request.

Server action forms
- Profile edits use a server action form (`<form action={updateMyProfile}>`) instead of a client `fetch` to an API route.
- Benefits: built-in CSRF protection, fewer moving parts, direct access to auth cookies on the server, simpler redirects (`redirect('/profile')`).

