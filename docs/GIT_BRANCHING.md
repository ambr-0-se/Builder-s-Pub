# Git Branching Guide (MVP)

Purpose: keep `main` stable while shipping small, reviewable PRs per stage.

## Branch roles
- `main`: trunk; always green and deployable.
- Feature/Work branches (short-lived):
  - `feat/<stage>-<name>` for user-facing features. Example: `feat/stage-2-auth`.
  - `fix/<desc>` for bug fixes.
  - `chore/<desc>` for maintenance/meta (config, setup). Example: `chore/stage-0-setup`.
  - `docs/<desc>` for documentation-only.

## Base branch selection
- Default base for new work: `main`.
- If a branch depends on unmerged work, base it on that branch (temporary chain). Example: base Stage 0 on `feat/v0-ui-import` until it merges.
- After dependency merges, prefer rebasing onto `main` or retarget the PR base in GitHub.

## PR rules
- One PR per small stage/task; squash-merge.
- Title prefix matches branch type: `feat:`, `fix:`, `chore:`, `docs:`.
- Description includes: scope, run steps, acceptance checks, and known limitations.
- Link to `docs/MVP_TECH_SPEC.md` stage when relevant.

## Merge order for current MVP
1) UI import → `feat/v0-ui-import` into `main`.
2) Stage 0 setup → ensure it’s either included in (1) or merged next into `main`.
3) Subsequent stages (Stage 2–13) from `main`, one PR each. (Stage 1 completed)

## Cleanup
- Delete remote branches after merge.
- Keep `main` up to date locally: `git checkout main && git pull`.

## Common commands
```bash
# Create a feature branch from main
git checkout main && git pull
git checkout -b feat/stage-2-auth

# Rebase onto latest main
git fetch origin
git rebase origin/main

# Retarget PR base in GitHub UI: Edit → change Base branch

# Delete remote branch after merge
git push origin --delete feat/stage-2-auth
```


