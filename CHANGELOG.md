# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog (https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning (https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Development: Standardized package manager to pnpm and added Corepack setup
  - Enforced via `web/package.json` preinstall guard
  - Docs updated: `ops/ENVIRONMENT.md`, `web/README.md`, `docs/MVP_TECH_SPEC.md`, `web/SPECIFICATION.md`

### Fixed
- Toast System: Fixed duplicate success toasts after project creation
  - Implemented sessionStorage-based deduplication with per-project unique keys
  - Added useRef guard in CreatedToastOnce component to prevent multiple executions
  - Files: web/lib/created-flag.ts, web/app/projects/[id]/created-toast.tsx, web/tests/created-flag.test.ts

- Next.js 15 Compatibility: Fixed async params requirement in dynamic routes
  - Updated project detail page to use await params
  - Files: web/app/projects/[id]/page.tsx

- Development Environment: Fixed build manifest corruption causing internal server errors
  - Created reset script for handling Next.js cache corruption issues
  - Files: web/scripts/reset-dev.sh

### Added
- Development Tools: Added scripts/reset-dev.sh for robust development environment recovery

### Changed
- Form Submission: Simplified project creation form submission flow
  - Removed client-side success handling from new project page
  - Success feedback handled exclusively on detail page after redirect
  - Files: web/app/projects/new/page.tsx, web/app/projects/actions.ts

