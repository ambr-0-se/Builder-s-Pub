Title: Generate the Builder’s Pub MVP UI (Next.js App Router + TypeScript + Tailwind)

Act as a senior frontend engineer. Produce a production-ready, accessible, responsive UI for the “Builder’s Pub” MVP using:
- Next.js (App Router) + TypeScript
- Tailwind CSS (light mode only; Apple-inspired, clean, minimal)
- Minimal deps; componentized, reusable, well-typed code
- No real backend calls yet. Create a typed data layer with mock services and TODOs to integrate Supabase later.

High-level concept
- Global hub to showcase AI/vibe-coded student projects.
- Users can browse, filter, upvote, comment, and discover collaboration posts.
- Design: light, clean, friendly; Product Hunt-style cards; emphasis on tags and discovery.

Information Architecture (routes)
- / (Landing: bento grid with Featured, Trending, Collab previews, Tag exploration)
- /auth/callback (placeholder page for Supabase magic link return)
- /profile, /profile/edit
- /projects, /projects/new, /projects/[id]
- /collaborations, /collaborations/new, /collaborations/[id]
- /search?q=...&tech=...&cat=...

Core UI requirements (MVP scope)
1) Global Navigation
- Logo “Builder’s Pub”
- Search input (submits to /search)
- Links: Projects, Collaborations, Tags
- Auth button: “Sign in”/avatar menu (stubbed; see Auth States)
- Responsive: collapses to menu on mobile

2) Landing Page (/)
- Bento grid hero with 3 sections: Featured Projects, Trending Projects, Collaboration Highlights
- “Get Inspired” tag clusters (surface popular technology + category tags)
- CTAs: “Post a project”, “Find collaborators”
- Minimal hero copy; subtle micro-animations

3) Projects
- /projects: grid layout, paginated (20/page) with tabs for Recent | Popular
- Filters: multi-select chips for Technology and Category; OR within a type, AND across types
- ProjectCard: title, tagline, tags, upvote count, owner, demo/source links, created_at
- Empty state with CTA to “Post your first project”
- Skeleton loading states

- /projects/new: project creation form
  - Fields: title (≤80), tagline (≤140), description (≤4000), demoUrl (required, http/https), sourceUrl (optional), ≥1 tech tag, ≥1 category tag
  - Client validation + disabled submit while pending; inline errors
  - On success: toast + redirect to /projects/[id]

- /projects/[id]: detail
  - Above the fold: title, tagline, author, upvote button (1 per user), total upvotes
  - Demo embed (YouTube/Vercel recognized; else external link button)
  - Tags (technology + category)
  - Description (md-friendly styles)
  - Comments: list + add comment (1–1000 chars); show delete for own comments
  - Collaborators list (simple section, can be placeholder)

4) Collaboration Board
- /collaborations: list view with filters:
  - kind = ongoing | planned | individual | organization
  - skills substring filter
- Card: kind badge, title, description snippet, skills chips, region (optional), commitment
- /collaborations/new: creation form with above fields; same validation UX as projects
- /collaborations/[id]: detail page

5) Profiles
- /profile: view own profile; display_name (required), bio, links (GitHub, LinkedIn, website), projects, collaborations
- /profile/edit: edit with URL validation; display_name 1–80 chars

6) Search & Discoverability
- /search: search by title/description; filters for tech/category tags; result counts; empty state
- Sort toggles: Recent | Popular on projects listing
- Tag pages optional: selecting a tag chips pre-fills filters on /projects

Auth States (stubbed for now; Supabase later)
- Create a simple `useAuthMock()` with boolean isAuthenticated, user stub
- Gate actions (comment, upvote, create/edit) behind auth; show sign-in prompt if not auth
- Include /auth/callback placeholder page
- Place clear TODOs where Supabase integration will replace mocks

Design system & components
- Tailwind only; define tokens via utilities (spacing, radius, shadows)
- Components:
  - Button, Input, Textarea, Select, Badge/Chip, Checkbox/Toggle
  - Navbar, Footer
  - ProjectCard, ProjectGrid, TagChips, FilterBar, SortTabs
  - CommentList, CommentItem, CommentForm
  - Pagination or InfiniteScroll wrapper
  - EmptyState, Skeletons, Toasts
- Accessibility: semantic HTML, focus states, keyboard nav, aria labels
- SEO: `<Metadata>` for each route, OG tags for project detail

State, data layer, and types
- Centralized data layer in lib/api (mock only). Each function returns Promises with typed results and simulated latency.
- Provide TypeScript types matching our planned schema (keep it concise):
  - Profile { userId, displayName, bio?, githubUrl?, linkedinUrl?, websiteUrl? }
  - Tag { id: number; name: string; type: 'technology' | 'category' }
  - Project { id, ownerId, title, tagline, description, demoUrl, sourceUrl?, createdAt, softDeleted? }
  - ProjectWithRelations { project, tags: { technology: Tag[]; category: Tag[] }, upvoteCount: number, comments: Comment[] }
  - Comment { id, projectId, authorId, body, createdAt, softDeleted? }
  - Collaboration { id, ownerId, kind: 'ongoing'|'planned'|'individual'|'organization', title, description, skills: string[], region?: string, commitment?: string, createdAt, softDeleted? }

Implement mock API with the following signatures (aligning with our upcoming server actions):
- createProject(input): -> { id }
- listProjects(params: { cursor?, limit=20, sort: 'recent'|'popular', techTagIds?, categoryTagIds? }): -> { items: ProjectWithRelations[], nextCursor? }
- getProject(id): -> ProjectWithRelations
- upvoteProject(projectId): -> { ok: true } | { error: 'conflict'|'unauthorized' }
- addComment(projectId, body): -> { id }
- deleteComment(commentId): -> { ok: true }
- updateProject(id, fields)
- deleteProject(id)

- createCollab(input)
- listCollabs(params: { kind?, skills?, cursor?, limit=20 })
- getCollab(id), updateCollab(id, fields), deleteCollab(id)

Tag governance and seeds
- Tags are a controlled vocabulary (users select existing)
- Seed a small set of tags in constants/tags.ts:
  - technology: LLMs, NLP, Computer Vision, Agents, Audio, Robotics
  - category: Productivity, Education, Finance, Healthcare, Creative, DevTools

UX and validation
- Forms: client validation, pending disabled, inline errors; success toast + redirect
- Lists: skeleton loaders; empty states with CTAs
- Errors: friendly messages for unauthorized, conflict, and generic retry
- Upvote: optimistic UI with rollback on error (mock level)

Landing and cards visual guidance
- Apple-inspired light theme; subtle shadows; rounded corners; hover lift on cards
- Product Hunt-style project cards emphasizing title, tagline, tags, and upvote affordance
- Clean typography and generous spacing

Analytics placeholders
- Add `useAnalyticsMock()` helper to log events to console with consistent names:
  - project_created, project_viewed, project_upvoted, comment_added
  - collaboration_created, collaboration_viewed, search_performed, filters_applied
- Call these at obvious interaction points

Project structure (suggestion)
- app/(routes)/...
- components/ui/... (reusable primitives)
- components/features/projects/..., collaborations/..., profile/...
- lib/api/mockProjects.ts, mockCollabs.ts, mockAuth.ts, analytics.ts
- constants/tags.ts
- styles/globals.css
- README with run instructions

Deliverables
- Complete Next.js App Router project, runnable with `pnpm dev` or `npm run dev`
- All routes and components above implemented with mock data layer
- Strong TypeScript types; no any
- Linting and formatting configured
- Clear TODO comments where Supabase integration will replace mocks

Acceptance criteria checklist
- All listed routes render and are responsive
- Project create form enforces all constraints
- Project detail embeds demo and supports comments/upvote UI with auth gating
- Collaboration board supports kind + skills filters and creation
- Search and tag filters work against mock data with correct AND/OR logic
- Skeletons, empty states, and toasts implemented
- SEO metadata present on key pages
- Code is componentized, typed, and easy to wire to Supabase later
