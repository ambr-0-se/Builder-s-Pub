# Stage X Implementation Plan: Name of Stage X

**Status:** Planned  
**Started:** [Today's date]
**Completed:** —

## Overview

Overview of stage X

## Tasks

### 1. Task 1
Explanation of task 1

### 2. Task 2  
Explanation of task 2


## Actionable and Specific Steps

### Step 1: 
**Goal:** 

**What we are doing:** 

**Technical details:**

**Files:**
- Add: 
- Add: 
- Change:
- Change:
- Potentially affected:
- Potentially affected:

**Tests:** 

**Status:** Not Started

---

### Step 2: 
**Goal:** 

**What we are doing:** 

**Technical details:**

**Files:**
- Add: 
- Add: 
- Change:
- Change:
- Potentially affected:
- Potentially affected:

**Tests:** 

**Status:** Not Started

--- 
### Step 2: Normalize admin tag input + friendly duplicate messaging
**Goal:** Ensure whitespace/casing normalized before validation and show a clear error if a case‑insensitive duplicate exists.

**What we are doing:** Clean up the tag name (trim extra spaces) before saving. If the tag already exists (even with different casing), show an easy‑to‑understand error.

**Technical details:**
- Update validation to trim and collapse inner whitespace (e.g., multiple spaces → single space).
- Preserve 23505 handling; update error copy to "Tag already exists (case‑insensitive)."
- Pre‑submit UI check: warn inline if a case‑insensitive match exists.

**Files:**
- Change: `web/lib/validation/tags.ts` (normalize input)
- Change: `web/app/admin/tags/actions.ts` (error message)
- Change: `web/app/admin/tags/tag-manager.tsx` (inline notice before submit)
- Change: `web/app/admin/tags/AdminCreateTagForm.tsx` (mirror inline notice)

**Tests:** 

**Status:** Not Started

---

Remaining steps

---

## Acceptance Criteria

- Acceptance criteria 1
- Acceptance criteria 2
  - Acceptance criteria 2.1
  - Acceptance criteria 2.2


## Workflow

At each step in 'Actionable and specific steps':

- Explain clearly what we are doing and why (layman’s terms), add technical details when terms are used.
- Inspect relevant code, documents, and `.cursorrules` before making changes.
- Implement minimal, robust, reusable code; identify all affected files to prevent regressions.
- Add/adjust tests; ensure all tests pass.
- Guide user to review code/UI; after approval, update progress tracking and docs.
- AFTER user's approval, commit with Conventional Commits and push. ONLY then proceed to the next step.

If you need help from user, give clear instructions to user on how to do it or what needs to be decided on.

## Progress Tracking

| Step | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| 1. Step 1 | Not Started | — | — |  |
| 2. Step 2 | Not Started | — | — |  |
Remaining steps

## Risk Mitigation


---

**Last Updated:** [Today's date] 
**Next Review:** 


