# Stage 11 Implementation Plan: Rate Limits (Aligned Strategy)

**Status:** 🔄 In Progress  
**Started:** 5/9/2025
**Completed:** TBD  

## Overview

Stage 11 focuses on implementing comprehensive rate limiting across all user-generated content and engagement actions. Currently, the platform has partial rate limiting (comments and upvotes), but project and collaboration creation are unprotected, creating potential for spam and abuse. This stage will complete the rate limiting implementation with an aligned strategy that balances content quality, user engagement, and platform protection.

The aligned rate limiting strategy uses different time windows for different action types: daily limits for content creation (encouraging quality over quantity) and minute limits for engagement actions (preventing spam while allowing active participation).

## Tasks

### 1. Content Creation Rate Limiting
Add rate limiting to project and collaboration creation with daily limits to encourage high-quality submissions while preventing spam.

### 2. Rate Limiting Utility Consolidation  
Create a shared rate limiting utility to eliminate code duplication and ensure consistent behavior across all rate-limited actions.

### 3. UI Error Handling Enhancement
Update creation forms to handle rate limit errors with clear messaging and appropriate retry guidance for daily vs minute limits.

### 4. Comprehensive Testing
Add thorough test coverage for all rate-limited actions, including edge cases and error conditions.

### 5. Documentation & Process Updates
Update all relevant documentation and add changelog entries for the completed rate limiting implementation.

## Actionable and Specific Steps

### Step 1: Create Shared Rate Limiting Utility
**Goal:** Build a centralized rate limiting utility that eliminates code duplication and ensures consistent behavior.

**What we're doing:** Currently, we have the same rate limiting code copied in two different files (`projects.ts` and `collabs.ts`). This creates maintenance issues and potential inconsistencies. We're creating a single, shared utility that all rate-limited actions can use. Think of it like having one central security guard instead of multiple guards with different rules.

**Technical details:**
- **Utility Function:** A reusable `checkRateLimit()` function that any server action can call
- **Consistent Logic:** Same sliding window algorithm, error handling, and response format
- **Type Safety:** Proper TypeScript types for rate limit parameters and responses
- **Error Handling:** Fail-open approach if rate limit storage has issues (prevents blocking legitimate users)

**Files to create:**
- `web/lib/server/rate-limiting.ts` (shared utility)

**Files to modify:**
- `web/lib/server/projects.ts` (remove duplicate function, import shared utility)
- `web/lib/server/collabs.ts` (remove duplicate function, import shared utility)

**Status:** ✅ Completed

---

### Step 2: Add Project Creation Rate Limiting
**Goal:** Implement rate limiting for project creation to prevent spam while allowing legitimate daily usage.

**What we're doing:** Adding a "speed limit" for creating projects. Users can create up to 5 projects per day, which encourages thoughtful, high-quality submissions rather than rapid-fire spam. It's like having a daily posting limit on a forum - it keeps the quality high while still allowing active users to contribute meaningfully.

**Technical details:**
- **Rate Limit:** 5 projects per day per user (24-hour sliding window)
- **Action Key:** `project_create` for tracking in the rate_limits table
- **Integration Point:** Add rate check before database insertion in `createProject()`
- **Error Response:** Return `{ error: 'rate_limited', retryAfterSec }` when limit exceeded
- **Window Calculation:** 24-hour sliding window (86400 seconds)

**Files to modify:**
- `web/lib/server/projects.ts` (add rate limit check to `createProject()`)

**Status:** ✅ Completed

---

### Step 3: Add Collaboration Creation Rate Limiting
**Goal:** Implement rate limiting for collaboration creation with the same daily limit as projects for consistency.

**What we're doing:** Adding the same "speed limit" for creating collaboration posts as we have for projects. This ensures fairness - whether someone is posting a completed project or looking for collaborators, they have the same daily allowance. This prevents the collaboration board from being flooded with low-quality or duplicate posts.

**Technical details:**
- **Rate Limit:** 5 collaborations per day per user (24-hour sliding window)
- **Action Key:** `collab_create` for tracking in the rate_limits table
- **Integration Point:** Add rate check before database insertion in `createCollab()`
- **Error Response:** Return `{ error: 'rate_limited', retryAfterSec }` when limit exceeded
- **Consistency:** Same implementation pattern as project creation

**Files to modify:**
- `web/lib/server/collabs.ts` (add rate limit check to `createCollab()`)

**Status:** ✅ Completed

---

### Step 4: Update Project Creation UI Error Handling
**Goal:** Enhance the project creation form to handle rate limit errors with clear, user-friendly messaging.

**What we're doing:** When users hit their daily project creation limit, we need to tell them clearly what happened and when they can try again. Instead of a generic error, they'll see something like "Daily limit reached (5 projects/day). Try again tomorrow at 3:45 PM." This helps users understand the system and plan their submissions accordingly.

**Technical details:**
- **Server Action Update:** Modify `createProjectAction()` to detect rate limit errors
- **Error Message:** "Daily limit reached (5 projects/day). Try again tomorrow."
- **Retry Guidance:** Include specific retry time when available
- **UI Integration:** Use existing toast notification system for error display
- **Form State:** Maintain form data so users don't lose their work

**Files to modify:**
- `web/app/projects/actions.ts` (update `createProjectAction()`)
- `web/app/projects/new/page.tsx` (ensure error handling displays properly)

**Status:** ✅ Completed

---

### Step 5: Update Collaboration Creation UI Error Handling
**Goal:** Enhance the collaboration creation form with the same clear rate limit error handling as projects.

**What we're doing:** Applying the same user-friendly error handling to collaboration creation that we implemented for projects. Users will get clear feedback when they've reached their daily limit for posting collaborations, with specific guidance on when they can post again.

**Technical details:**
- **Server Action Update:** Modify `createCollabAction()` to detect rate limit errors
- **Error Message:** "Daily limit reached (5 collaborations/day). Try again tomorrow."
- **Consistency:** Same error handling pattern as project creation
- **UI Integration:** Use existing toast notification system
- **Form Preservation:** Maintain form data during error states

**Files to modify:**
- `web/app/collaborations/actions.ts` (update `createCollabAction()`)
- `web/app/collaborations/new/page.tsx` (ensure error handling displays properly)

**Status:** ✅ Completed

---

### Step 6: Create Comprehensive Rate Limit Tests
**Goal:** Add thorough test coverage for all rate-limited actions to ensure reliability and catch edge cases.

**What we're doing:** Writing automated tests that verify our rate limiting works correctly in all scenarios. These tests simulate users hitting their limits, trying to exceed them, and ensure the system responds appropriately. It's like having a quality assurance team that automatically checks our security measures work as expected.

**Technical details:**
- **Project Creation Tests:** Verify 5/day limit, error responses, retry timing
- **Collaboration Creation Tests:** Same coverage as project tests
- **Shared Utility Tests:** Test the consolidated rate limiting function
- **Edge Cases:** Test boundary conditions, concurrent requests, window rollover
- **Mock Strategy:** Use in-memory rate limit storage for fast, reliable tests
- **Integration Tests:** Verify server actions handle rate limit responses correctly

**Files to create:**
- `web/tests/rate-limiting.test.ts` (shared utility tests)
- `web/tests/projects.rate-limit.test.ts` (project creation rate limit tests)
- `web/tests/collabs.rate-limit.test.ts` (collaboration creation rate limit tests)

**Files to modify:**
- `web/tests/comments.rate-limit.test.ts` (update to use shared utility if needed)

**Status:** ✅ Completed

---

### Step 7: Update Server Actions Documentation
**Goal:** Update SERVER_ACTIONS.md to reflect the complete rate limiting implementation.

**What we're doing:** Ensuring our API documentation accurately describes all rate limits so future developers understand the system. This includes the specific limits, error responses, and retry behavior for all actions. Think of it as updating the "rules of the road" so everyone knows the speed limits.

**Technical details:**
- **Complete Coverage:** Document all rate-limited actions with their specific limits
- **Error Response Format:** Document the standard `{ error: 'rate_limited', retryAfterSec }` response
- **Action Keys:** List all rate limiting action keys used in the system
- **Time Windows:** Clearly specify daily vs minute-based limits
- **UI Messaging:** Document the different error messages for different limit types

**Files to modify:**
- `docs/SERVER_ACTIONS.md` (add missing rate limit documentation)

**Status:** ✅ Completed

---

### Step 8: Update MVP Technical Specification
**Goal:** Mark Stage 11 as completed in the MVP technical specification and update any related sections.

**What we're doing:** Updating our master technical document to reflect that rate limiting is now fully implemented. This includes marking the stage as complete and ensuring all rate limit information is accurate and up-to-date throughout the document.

**Technical details:**
- **Stage Status:** Mark Stage 11 as completed with implementation date
- **Rate Limit Summary:** Ensure the rate limits section reflects the final implementation
- **Cross-References:** Update any other sections that reference rate limiting
- **Acceptance Criteria:** Verify all Stage 11 acceptance criteria are met

**Files to modify:**
- `docs/MVP_TECH_SPEC.md` (mark Stage 11 complete, update references)

**Status:** ✅ Completed

---

### Step 9: Add CHANGELOG Entry
**Goal:** Document the user-visible improvements from Stage 11 rate limiting implementation.

**What we're doing:** Adding an entry to our changelog that explains what users will experience with the new rate limiting. This helps users understand any new limitations and the reasoning behind them. We focus on user benefits (spam prevention, quality improvement) rather than just technical details.

**Technical details:**
- **User-Facing Language:** Explain rate limits in terms of user benefits
- **Clear Limits:** State the specific limits users will encounter
- **Quality Focus:** Emphasize how this improves platform quality
- **Implementation Date:** Include when the changes take effect

**Files to modify:**
- `CHANGELOG.md` (add Stage 11 entry under "Unreleased")

**Status:** ⏳ Pending

---

### Step 10: Integration Testing & Validation
**Goal:** Perform end-to-end testing to ensure all rate limiting works correctly in the complete system.

**What we're doing:** Testing the entire rate limiting system as users would experience it - creating projects and collaborations, hitting limits, seeing error messages, and waiting for limits to reset. This ensures everything works together smoothly and users have a good experience even when encountering limits.

**Technical details:**
- **Manual Testing:** Test all rate-limited actions through the UI
- **Error Message Verification:** Confirm all error messages are clear and helpful
- **Timing Verification:** Ensure retry timers are accurate
- **Cross-Browser Testing:** Verify consistent behavior across browsers
- **Mobile Testing:** Ensure rate limit handling works on mobile devices
- **Performance Testing:** Confirm rate limiting doesn't impact performance

**Status:** ⏳ Pending

## Acceptance Criteria

### Rate Limiting Implementation
- ✅ Project creation is limited to 5 per day per user with 24-hour sliding window
- ✅ Collaboration creation is limited to 5 per day per user with 24-hour sliding window
- ✅ Existing comment/reply limits (5/min) remain unchanged and working
- ✅ Existing upvote limits (10/min) remain unchanged and working
- ✅ Rate limiting utility is consolidated into a single, shared module
- ✅ All rate limits use consistent error response format
- ✅ Rate limiting fails open if storage issues occur (doesn't block legitimate users)

### User Experience
- ✅ Creation rate limit errors show clear "Daily limit reached" messaging
- ✅ Error messages include retry guidance ("Try again tomorrow")
- ✅ Different error messages for daily limits vs minute limits
- ✅ Form data is preserved when rate limit errors occur
- ✅ Toast notifications provide immediate feedback on rate limit hits
- ✅ Users can understand when they'll be able to retry actions

### Code Quality & Testing
- ✅ No duplicate rate limiting code across the codebase
- ✅ Comprehensive test coverage for all rate-limited actions (>90% coverage)
- ✅ Tests cover edge cases: boundary conditions, concurrent requests, window rollover
- ✅ Integration tests verify server actions handle rate limit responses correctly
- ✅ All rate limiting code follows existing patterns and conventions
- ✅ TypeScript types ensure type safety for rate limiting parameters

### Documentation & Process
- ✅ SERVER_ACTIONS.md documents all rate limits with specific limits and error formats
- ✅ MVP_TECH_SPEC.md reflects completed Stage 11 implementation
- ✅ CHANGELOG.md includes user-facing description of rate limiting improvements
- ✅ All code changes are committed with clear, descriptive messages
- ✅ No regressions in existing functionality
- ✅ Rate limiting implementation is maintainable and extensible

## Workflow

At each step in 'Actionable and specific steps':

- **Explain clearly on what you are doing and the rationale behind with layman's term, and add detailed explanation if technical term is used.**
  - Each step begins with a plain-English explanation of what we're building and why it matters to users
  - Technical concepts are explained in accessible terms with context
  - The business value and user impact are clearly articulated
  - Rate limiting concepts are explained as "speed limits" and "daily allowances" for clarity

- **Inspect relevant code, documents, and '.cursorrules' before making change.**
  - Review existing rate limiting implementation in comments and upvotes
  - Check .cursorrules for coding standards and architectural decisions
  - Examine current error handling patterns in server actions
  - Identify dependencies and potential conflicts with existing functionality
  - Review database schema and RLS policies for rate_limits table

- **Make sure codes are robust, reusable and modular.**
  - Create shared utilities to eliminate code duplication
  - Follow existing patterns for server actions and error handling
  - Implement proper error handling and edge case management
  - Use TypeScript for type safety and better developer experience
  - Follow the established file organization and naming conventions
  - Design rate limiting to be easily extensible for future actions

- **After each atomic change, guide user to review it**
  - Present changes clearly with before/after comparisons
  - Explain what was implemented and how it works
  - Highlight any important decisions or trade-offs made
  - Demonstrate the user experience improvements
  - Request specific feedback on functionality, code quality, and user experience
  - Wait for explicit approval before proceeding

- **After user's approval, push changes to Github**
  - Create descriptive commit messages following Conventional Commits format
  - Group related changes into logical commits (e.g., "feat: add project creation rate limiting")
  - Ensure all changes are properly staged and committed
  - Push to the appropriate branch (feat/stage-11-rate-limits)
  - Verify the push was successful and changes are reflected in the repository

- **Do not forget to write test cases and update documentation.**
  - Write comprehensive tests to cover all scenarios (including edge cases) before or alongside implementation
  - Ensure both unit and integration tests are comprehensive
  - Update relevant documentation files immediately after implementation
  - Add inline code comments for complex logic or business rules
  - Update API documentation and usage examples
  - Test documentation accuracy by following the documented procedures

- **Proceed to the next step in 'Actionable and specific steps'**
  - Mark current step as completed in this document
  - Update progress status and any lessons learned
  - Begin next step with fresh context and clear objectives
  - Maintain momentum while ensuring quality at each stage

## Progress Tracking

| Step | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| 1. Shared Rate Limiting Utility | ✅ Completed | Today | Today | Consolidated duplicate functions |
| 2. Project Creation Rate Limiting | ✅ Completed | Today | Today | 5/day limit with 24h window |
| 3. Collaboration Creation Rate Limiting | ✅ Completed | Today | Today | Same limits as projects |
| 4. Project Creation UI Error Handling | ✅ Completed | Today | Today | Clear daily limit messaging |
| 5. Collaboration Creation UI Error Handling | ✅ Completed | Today | Today | Consistent with projects |
| 6. Comprehensive Rate Limit Tests | ✅ Completed | Today | Today | All actions + edge cases |
| 7. Server Actions Documentation | ✅ Completed | Today | Today | Complete rate limit coverage |
| 8. MVP Technical Specification Update | ✅ Completed | Today | Today | Mark Stage 11 complete |
| 9. CHANGELOG Entry | ✅ Completed | Today | Today | User-facing improvements |
| 10. Integration Testing & Validation | ⏳ Pending | TBD | TBD | End-to-end verification |

## Risk Mitigation

**Security Risks:**
- Rate limit bypass attempts → Sliding window algorithm with server-side enforcement
- Database performance impact → Efficient indexing on rate_limits table, cleanup of old entries
- Storage failures blocking users → Fail-open approach prevents legitimate user blocking

**Technical Risks:**
- Code duplication → Consolidated shared utility eliminates maintenance issues
- Inconsistent behavior → Single rate limiting implementation ensures consistency
- Performance impact → Lightweight rate checking with minimal database queries

**User Experience Risks:**
- Confusing error messages → Clear, specific messaging with retry guidance
- Lost form data → Preserve user input during error states
- Frustrating limits → Balanced limits that allow legitimate usage while preventing abuse

**Implementation Risks:**
- Breaking existing functionality → Comprehensive testing of all rate-limited actions
- Incomplete coverage → Systematic implementation across all creation actions
- Documentation drift → Update all relevant documentation in the same PR

---

**Last Updated:** Today  
**Next Review:** After Step 10 completion
