Project Requirement Document (PRD)

Project Name: Builder's Pub
Prepared by: Ambrose Lee
Date: Aug 2025

⸻

1. Overview

Vision: Build a global hub where students and builders showcase AI and vibe-coded projects. The platform helps users share prototypes, receive meaningful feedback, and find collaborators — while making it easy to explore applications of AI in different domains.

MVP Goal: Deliver a simple but engaging platform where users can:
	•	Create profiles
	•	Post projects with structured details (AI focus emphasized)
	•	Comment/upvote using reviewer tags
	•	Browse/filter projects by technology & category
	•	Access a collaboration board to join or start new projects

⸻

2. Purpose & Objectives
	•	Purpose: Showcase and grow the ecosystem of AI + vibe-coded projects with global student-first positioning.
	•	Objectives:
	1.	Highlight AI-driven projects (require AI as a differentiator or core component).
	2.	Enable structured discovery through tags for technology (e.g., Computer Vision, NLP, LLMs) and categories (e.g., Finance, Productivity).
	3.	Provide meaningful feedback tools (comments, upvotes, reviewer tags).
	4.	Facilitate collaboration by listing ongoing/planned projects and individuals looking to join.
	5.	Create a global showcase attractive to both builders and investors.

⸻

3. Target Audience
	•	Primary: Students and young builders (technical + non-technical) showcasing AI/vibe-coded projects.
	•	Secondary:
	•	Companies/universities looking for student collaborators.
	•	Investors scouting early AI talent and prototypes.

⸻

4. Problems Solved
	•	Beginners and non-CS students lack an easy way to start and showcase vibe-coded/AI projects.
	•	Difficulty getting meaningful feedback beyond friends/hackathon peers.
	•	Few structured ways to connect with relevant collaborators globally.
	•	No dedicated global hub for student-driven AI prototypes attractive to builders + investors.

⸻

5. Unique Selling Proposition (USP)
	•	AI + Vibe-coding focus: all projects must involve AI in some capacity.
	•	Beginner-friendly showcase: easy posting and commenting.
	•	Discovery via tags: clear technology tags (NLP, LLM, CV, etc.) and category tags (productivity, healthcare, finance, etc.).
	•	Collaboration-first: board for ongoing/planned projects and individuals.
	•	Professional yet student-first: global accessibility, simple and cool design.

⸻

6. Core MVP Features

6.1 User & Authentication
	•	Email-based signup/login (Supabase magic link).
	•	User profile: summary, projects, collaborations, links (GitHub, LinkedIn, personal site).

6.2 Project Showcase
	•	Project creation form (must include AI component):
	•	Title & tagline
	•	Description (problem, solution, inspiration)
	•	Demo link (mandatory)
	•	Source code link (optional)
	•	Technology tags (e.g., NLP, Computer Vision, LLMs)
	•	Category tags (e.g., Finance, Productivity, Education)
	•	Project page: demo/video embed, description, comments, collaborators list.

6.3 Feedback & Engagement
	•	Comments (open to all).
	•	Upvotes on projects and comments.
	•	Reviewer tags (e.g., Interesting Idea, Strong Execution, Needs Improvement, Inspirational).

6.4 Collaboration Board
	•	A dedicated section with filters:
	•	Ongoing projects looking for members
	•	Planned projects (idea-stage)
	•	Individuals seeking projects (domain/skills specified)
	•	Companies/universities recruiting collaborators
	•	Entries contain: title, description, desired skills/roles, region (optional), commitment.

6.5 Discoverability
	•	Project filtering by technology tags and category tags.
	•	Search by title, keyword, tags, region.
	•	Popular/trending based on upvotes & engagement.

6.6 Landing Page
	•	Bento grid design.
	•	Sections:
	•	Featured popular projects
	•	Trending projects
	•	Collaboration recommendations (board previews)
	•	“Get Inspired” by exploring tags (e.g., AI in Finance, NLP in Productivity).

⸻

7. Advanced Features (Post-MVP)
	•	OAuth with Gmail + GitHub.
	•	AI-generated feedback (LLM critique).
	•	Personalized project/collaboration recommendations.
	•	Auto-generated profiles from GitHub/LinkedIn API.
	•	Forum for news/discussions.
	•	Marketplace for project buying/selling.
	•	LLM-assisted collaboration applications.

⸻

8. Development Stages

Stage 1: Foundation
	•	Supabase setup (auth, DB, storage).
	•	Email login (magic link).
	•	User profiles.

Stage 2: Project Showcase
	•	Create/view project posts with tags.
	•	Project listing grid.
	•	Project detail page with comments/upvotes.

Stage 3: Collaboration Board
	•	CRUD for collaboration posts.
	•	Basic filtering by type/skills/domain.

Stage 4: Engagement Layer
	•	Reviewer tags for feedback.
	•	Upvotes on projects/comments.
	•	Trending & recent sorting.

Stage 5: Landing Page & Test Launch
	•	Bento grid homepage (popular projects + collaboration highlights).
	•	Invite-only or closed beta (test with ~100–200 users globally + HK universities).

Stage 6: Global Launch
	•	Public opening after testing iteration.
	•	Promotion through social media and HK campus ambassadors.

⸻

9. Tech Stack

Backend & Infra:
	•	Supabase (Postgres, Auth, Storage, Edge Functions).
	•	DB tables: Users, Profiles, Projects, Tags (Technology, Category), Comments, Upvotes, Collaborations.
	•	Row-Level Security (RLS) for user data privacy.

Frontend:
	•	React (Next.js optional).
	•	Tailwind CSS (clean, light mode).
	•	Supabase client SDK + React Query.

Deployment:
	•	Vercel (frontend).
	•	Supabase (backend + storage).
	•	CDN for static assets.

⸻

10. Design Principles
	•	Light mode, Apple-inspired: sleek, professional.
	•	ProductHunt-style grid: minimal, project-first.
	•	Tag-driven discovery: encourage exploration by tech/domain.
	•	Student-first tone: collaborative, approachable.

⸻

11. Risks & Mitigation
	•	Cold start problem: seed projects before launch (campus partners, early contributors).
	•	Feedback quality risk: use reviewer tags to structure comments.
	•	Spam/low-quality posts: moderation tools + invite-only testing before global launch.
	•	Scaling: Supabase infra sufficient for MVP; edge functions handle notifications.

⸻

12. Out of Scope (MVP)
	•	Monetization.
	•	AI-driven recommendations/feedback.
	•	Marketplace transactions.
	•	Advanced identity integrations (GitHub/LinkedIn auto-profile).

⸻

13. Success Criteria (subject to change)
	•	≥100 projects posted during test phase.
	•	≥70% projects tagged with at least one technology + one category.
	•	≥70% projects receive comments within 7 days.
	•	≥50 collaboration posts during testing.
	•	Active users from ≥3 global regions before global launch.

⸻

14. Technical Documents (MVP)
	•	MVP Tech Spec: concise engineering “how” for the MVP (stories, acceptance criteria, routes, server actions, validation/UX, governance, DoD). See [docs/MVP_TECH_SPEC.md](docs/MVP_TECH_SPEC.md).
	•	Schema overview: human-readable tables/relations/indexes and RLS summary. See [supabase/schema.md](supabase/schema.md).
	•	Schema SQL: canonical SQL to create MVP tables, constraints, and indexes. See [supabase/schema.sql](supabase/schema.sql).
	•	RLS policies: Row-Level Security policies for all user content tables. See [supabase/rls_policies.sql](supabase/rls_policies.sql).
	•	Non-Functional Requirements: performance, security, accessibility, SEO, privacy, migrations. See [docs/NFR.md](docs/NFR.md).
	•	Analytics Plan: events, properties, funnels, and instrumentation guidance. See [docs/ANALYTICS.md](docs/ANALYTICS.md).
	•	Environment & Setup: required env vars and local setup steps. See [ops/ENVIRONMENT.md](ops/ENVIRONMENT.md).
	•	Supabase Setup: applying schema/RLS and seeding data; auth config. See [supabase/README.md](supabase/README.md).