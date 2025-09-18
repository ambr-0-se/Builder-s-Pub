# UI Patterns

Purpose: Concise, reusable UI patterns used across the MVP. Keep this scoped to interaction and presentation conventions, not API or schema design.

## Optimistic UI

- Upvotes (projects, comments, collaborations)
  - Maintain a click lock to avoid concurrent toggles.
  - Derive a stable baseCount: `initialCount - (hasUserUpvoted ? 1 : 0)`.
  - Optimistically set `displayCount = baseCount + (optimisticUpvoted ? 1 : 0)`.
  - On server response, reconcile the optimistic flag; on error, revert and show a toast.

- Hiring toggle (collaborations)
  - Owner-only button with optimistic flip.
  - Use `useActionState(updateCollabAction)` and wrap the call in `startTransition(() => formAction(fd))`.
  - Keep `localHiring` state; store previous state in a ref for rollback on error.
  - Non-owners see a read-only badge that mirrors current status.

## Comment Threads

- Ordering
  - Top-level comments: newest → oldest.
  - Replies: oldest → newest (one level deep).

- Rules
  - Only authors can delete their own comments; deletion is permanent within MVP (no edit flow).
  - Reply parent must belong to the same collaboration/project and be a top-level comment.

## Badges and Chips

- Project Types (collaborations)
  - Outline chips with human labels (via `formatProjectType`).

- Hiring Status (collaborations)
  - Hiring: black background, white text, solid border.
  - No longer hiring: white background, gray text, outlined border.

- Tag Pickers (projects & collaborations)
  - Quick‑pick chips (curated) above a searchable combobox.
  - Selected colors: Technology (blue), Category (green). Do not convey meaning by color alone; include text/labels.
  - Caps: Technology ≤ 5; Category ≤ 3. Disable non‑selected options at cap; allow deselection always.
  - Keyboard: ArrowDown opens; Enter selects; Escape closes; focus returns to input.
  - Sorting: options are alphabetical; any tag named "Others" is forced to the bottom for clarity.
  - Defaults (current quick‑picks): Technology → Agents, LLM, Speech, Vibe Coding, Fine‑tuning. Category → Productivity, Education/ Study tools, Content/Media, Research.

## Character Counters and Limits

- Counters appear to the right of field labels or in compact helper text below inputs.
- Typical limits
  - Title: 160 characters (projects, collaborations).
  - Roles Hiring
    - Amount: 1–99
    - Prerequisite: ≤400
    - Good to have: ≤400
    - Description: ≤1200
  - Project Description: ≤4000
  - Contact: ≤200; Remarks: ≤1000

## Server Actions from Client Components

- Use `useActionState` or `useFormState` to bind server actions.
- Call returned functions inside a transition: `startTransition(() => formAction(fd))`.
- Do not pass server functions directly as props to client components.
- Prefer server action forms for authenticated writes (sets cookies/session properly on server).

## Accessibility and Status

- Buttons indicate pending state via `disabled` and visual feedback.
- Error messages use toasts and/or inline messages near the control.
- Badges and chips include accessible text; avoid communicating state by color alone.

## References

- Contracts: `docs/SERVER_ACTIONS.md`
- Data & RLS: `supabase/schema.md`
- Architecture: `docs/ARCHITECTURE.md`
- Tech Spec: `docs/MVP_TECH_SPEC.md`
