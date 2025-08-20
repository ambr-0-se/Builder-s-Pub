# Stage 4 Testing Plan: Tags from DB

## Test Environment Setup

### Prerequisites
1. ✅ Set ADMIN_EMAILS in `.env.local`: `ADMIN_EMAILS=your-email@example.com`
2. ✅ Set SUPABASE_SERVICE_ROLE_KEY in `.env.local`
3. ✅ Ensure you have at least one user account with email matching ADMIN_EMAILS
4. ✅ Database has `tags` table with RLS enabled and initial seed data

### Test Data Requirements
- At least 3 technology tags (e.g., LLMs, React, Python)
- At least 3 category tags (e.g., Education, Finance, Productivity)
- One admin user account
- One regular user account

---

## Automated Test Cases

### Unit Tests ✅ (17/17 passing)

**Tags API (`tests/tags.api.test.ts`)**
- ✅ fetchTagsByType returns sorted list
- ✅ fetchAllTags splits by type correctly

**Validation (`tests/tags.validation.test.ts`)**
- ✅ Requires name field
- ✅ Rejects names > 50 characters
- ✅ Requires valid type (technology/category)
- ✅ Accepts valid input
- ✅ Trims whitespace properly
- ✅ Accepts maximum length names

**Integration (`tests/tags.integration.test.ts`)**
- ✅ createTag rejects non-admin users
- ✅ createTag validates required fields
- ✅ createTag succeeds for admin users
- ✅ createTag handles duplicate tag errors
- ✅ isAdmin returns false for unauthenticated users
- ✅ isAdmin returns true for admin emails
- ✅ isAdmin returns false for non-admin emails
- ✅ isAdmin handles case-insensitive email matching

---

## Manual Test Cases

### 1. Tag Loading & Display

#### 1.1 Projects Filter Bar
**Test**: Tag filters load from database
- [ ] Go to `/projects`
- [ ] Verify Technology section shows tags from DB (not hardcoded)
- [ ] Verify Category section shows tags from DB
- [ ] Click "Show More" if >6 tags exist
- [ ] Verify all tags are clickable and toggle selection
- [ ] Clear filters and verify state resets

**Expected**: Tags are loaded dynamically, UI responds to selections

#### 1.2 Search Page Filters
**Test**: Search filters use DB tags
- [ ] Go to `/search`
- [ ] Verify same tag behavior as Projects page
- [ ] Try URL: `/search?tech=LLM&category=Education`
- [ ] Verify filters auto-apply after tags load
- [ ] Perform search with selected filters

**Expected**: URL parameters map to correct tag IDs after loading

#### 1.3 New Project Form
**Test**: Project creation uses DB tags
- [ ] Sign in and go to `/projects/new`
- [ ] Verify Technology Tags section loads from DB
- [ ] Verify Category Tags section loads from DB
- [ ] Try submitting without selecting tags
- [ ] Select 1+ tech and 1+ category tags
- [ ] Submit form (will fail in Stage 4 but tags should be selected)

**Expected**: Tag selection UI works with validation

#### 1.4 Home Page Popular Tags
**Test**: Landing page loads DB tags
- [ ] Go to `/` (home page)
- [ ] Scroll to "Get Inspired" section
- [ ] Verify tag buttons are from database
- [ ] Click a tag button
- [ ] Verify redirects to search with correct filter

**Expected**: Popular tags are dynamically loaded

### 2. Admin Tag Management

#### 2.1 Admin Access Control
**Test**: Admin page access restrictions
- [ ] **As non-admin user**: Go to `/admin/tags`
- [ ] Verify "403 — Admins Only" message appears
- [ ] **As admin user**: Go to `/admin/tags`
- [ ] Verify "Manage Tags" page loads with form

**Expected**: Only admin emails can access the page

#### 2.2 Tag Creation - Success Cases
**Test**: Admin can create valid tags
- [ ] Sign in as admin user
- [ ] Go to `/admin/tags`
- [ ] Fill name: "Machine Learning"
- [ ] Select type: "Technology"
- [ ] Click "Create Tag"
- [ ] Verify "Tag created." success message
- [ ] Go to `/projects` and verify new tag appears in filters
- [ ] Repeat with Category type tag

**Expected**: Tags are created and immediately available in UI

#### 2.3 Tag Creation - Validation Errors
**Test**: Form validation works correctly
- [ ] Go to `/admin/tags`
- [ ] Submit empty form
- [ ] Verify "Name is required" error
- [ ] Enter name > 50 characters: "This is a very long tag name that exceeds the maximum allowed length of fifty characters"
- [ ] Verify length error
- [ ] Enter valid name but no type selected
- [ ] Verify type validation

**Expected**: Client and server validation prevents invalid submissions

#### 2.4 Tag Creation - Duplicate Handling
**Test**: Duplicate tag prevention
- [ ] Create tag: name="React", type="Technology"
- [ ] Try creating same tag again
- [ ] Verify "Tag already exists" error message
- [ ] Try creating: name="React", type="Category" (different type)
- [ ] Verify this succeeds (name+type uniqueness)

**Expected**: Duplicates are prevented with clear error messages

### 3. End-to-End Tag Workflow

#### 3.1 Full Admin-to-User Flow
**Test**: Complete tag lifecycle
- [ ] **Admin**: Create new tag "AI Agents" (Technology)
- [ ] **Admin**: Create new tag "Robotics" (Category)  
- [ ] **User**: Go to `/projects/new`
- [ ] **User**: Verify new tags appear in selection
- [ ] **User**: Go to `/search`
- [ ] **User**: Verify new tags appear in filters
- [ ] **User**: Go to `/projects`
- [ ] **User**: Verify new tags appear in filters

**Expected**: New tags immediately available across all UI components

#### 3.2 Tag Performance & Loading
**Test**: Tag loading performance
- [ ] Open browser dev tools Network tab
- [ ] Go to `/projects`
- [ ] Verify single API call to fetch tags
- [ ] Go to `/search`
- [ ] Verify tags are cached (no additional calls)
- [ ] Hard refresh page
- [ ] Verify tags load within 500ms

**Expected**: Efficient tag loading without excessive API calls

### 4. Error Handling & Edge Cases

#### 4.1 Database Connection Issues
**Test**: Graceful degradation
- [ ] Temporarily break SUPABASE_URL in `.env.local`
- [ ] Go to `/projects`
- [ ] Verify "Loading tags..." or error state
- [ ] Restore correct URL
- [ ] Verify tags load correctly

**Expected**: App doesn't crash with DB issues

#### 4.2 Empty Tag State
**Test**: No tags scenario
- [ ] **Admin**: Access database directly
- [ ] **Admin**: Delete all tags from `tags` table
- [ ] Go to `/projects`
- [ ] Verify empty filter sections
- [ ] Go to `/projects/new`
- [ ] Verify form validation prevents submission
- [ ] **Admin**: Re-add some tags via `/admin/tags`
- [ ] Verify UI updates after page refresh

**Expected**: UI handles empty state gracefully

#### 4.3 Service Role Key Issues
**Test**: Admin functionality degradation
- [ ] Remove SUPABASE_SERVICE_ROLE_KEY from `.env.local`
- [ ] Try creating tag as admin
- [ ] Verify clear error message about missing service key
- [ ] Restore service key
- [ ] Verify tag creation works again

**Expected**: Clear error messaging for configuration issues

### 5. Security Testing

#### 5.1 RLS Policy Verification
**Test**: Row Level Security enforcement
- [ ] Open browser dev tools
- [ ] Go to `/projects`
- [ ] Check Network tab for tags API call
- [ ] Verify using anon key (not service role)
- [ ] Try direct database query as non-admin
- [ ] Verify can only SELECT, not INSERT/UPDATE/DELETE

**Expected**: RLS properly restricts tag writes to admins only

#### 5.2 Admin Email Case Sensitivity
**Test**: Email matching robustness
- [ ] Set ADMIN_EMAILS="Admin@Example.COM"
- [ ] Sign in with "admin@example.com" (lowercase)
- [ ] Verify admin access works
- [ ] Sign in with "ADMIN@EXAMPLE.COM" (uppercase)
- [ ] Verify admin access works

**Expected**: Case-insensitive email matching

### 6. Integration with Existing Features

#### 6.1 Project Cards Display Tags
**Test**: Tag display consistency
- [ ] Go to `/projects` 
- [ ] Verify project cards show technology tags (blue)
- [ ] Verify project cards show category tags (secondary color)
- [ ] Go to `/projects/[id]` for any project
- [ ] Verify same tag styling on detail page

**Expected**: Tags display consistently across all project views

#### 6.2 Search Results Filtering
**Test**: Tag filtering works end-to-end
- [ ] Go to `/search`
- [ ] Select 1 technology tag
- [ ] Verify project results are filtered
- [ ] Add 1 category tag
- [ ] Verify AND filtering (both tag types required)
- [ ] Select multiple tags of same type
- [ ] Verify OR filtering within type

**Expected**: Tag filtering matches MVP specification (AND across types, OR within type)

---

## Performance Benchmarks

### Load Time Targets
- [ ] Tags load within 500ms on first visit
- [ ] Subsequent tag requests use cache/don't re-fetch
- [ ] Admin tag creation completes within 2 seconds
- [ ] Page revalidation after tag creation within 1 second

### Memory Usage
- [ ] Tag data doesn't cause memory leaks
- [ ] useTags hook properly cleans up on unmount
- [ ] No excessive re-renders when tags load

---

## Rollback Plan

If critical issues found:
1. Restore `/constants/tags.ts` file
2. Revert UI components to use constants
3. Disable admin tag creation
4. Investigate and fix issues
5. Re-implement with fixes

---

## Test Sign-off

**Automated Tests**: ✅ 17/17 passing
**Manual Test Coverage**: ⏳ In Progress
- [ ] Tag Loading & Display (4 test cases)
- [ ] Admin Tag Management (4 test cases) 
- [ ] End-to-End Workflow (2 test cases)
- [ ] Error Handling (3 test cases)
- [ ] Security Testing (2 test cases)
- [ ] Integration Testing (2 test cases)

**Performance**: ⏳ Pending
**Security**: ⏳ Pending

**Ready for Production**: ⏳ Pending manual test completion
