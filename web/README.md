# Builder's Pub MVP

A global hub to showcase AI/vibe-coded student projects. Discover, collaborate, and get inspired by the next generation of builders.

## Features

- **Project Showcase**: Browse and discover amazing AI and student projects
- **Collaboration Board**: Find collaborators and join exciting projects
- **User Profiles**: Showcase your work and connect with other builders
- **Search & Discovery**: Find projects by technology, category, or keywords
- **Upvoting & Comments**: Engage with the community

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui patterns
- **State Management**: React hooks with mock API layer
- **Authentication**: Mock auth (ready for Supabase integration)

## Getting Started

### Prerequisites

- Node.js 18 LTS (see `.nvmrc`), Node 20 also works
- npm (recommended). If using npm, pass `--legacy-peer-deps` during install for now

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Environment variables:
   ```bash
   cp .env.local.example .env.local
   # fill in Supabase envs later; UI runs without them for now
   ```

4. Run the development server on port 3002 (avoids conflicts):
   ```bash
   npm run dev -- -p 3002
   ```

5. Open [http://localhost:3002](http://localhost:3002) in your browser

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (routes)/          # Route groups
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── features/         # Feature-specific components
│   └── layout/           # Layout components
├── lib/                  # Utilities and API
│   ├── api/              # Mock API layer
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── constants/            # App constants
└── README.md
```

## Mock Data Layer

The application currently uses a mock data layer that simulates API calls with realistic latency. This makes it easy to replace with real Supabase integration later.

### Key Mock Services

- `mockProjects.ts` - Project CRUD operations
- `mockCollabs.ts` - Collaboration management
- `analytics.ts` - Event tracking simulation

## TODO: Supabase Integration

The following areas are marked for Supabase integration:

1. **Authentication** (`lib/api/auth.ts`)
   - `useAuth()` provides `isAuthenticated`, `user`, `signIn(email?)`, `signOut()`
   - Magic link authentication via Supabase; callback handled at `/auth/callback`

2. **Database Operations**
   - Replace mock API calls with Supabase client
   - Implement real-time subscriptions
   - Add proper error handling

3. **File Storage**
   - Add project image uploads
   - Profile avatar uploads

## Design System

The app uses a clean, Apple-inspired design with:

- **Colors**: Blue primary, gray neutrals, semantic colors for states
- **Typography**: Inter font family with consistent sizing
- **Components**: Reusable UI components following shadcn/ui patterns
- **Layout**: Responsive design with mobile-first approach

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
