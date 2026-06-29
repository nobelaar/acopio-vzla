# Spec: Contributor Guardrails for Open-Source

**Date**: 2025-06-29
**Context**: Acopio is going public on GitHub. Need automated safeguards so external contributors don't break the build, commit secrets, or bypass conventions.

## 1. Pre-commit hooks (lefthook)

**Tool**: `lefthook` (Go binary, no Node dependency, fast, supports glob filtering).

**Jobs on `pre-commit`**:

| Job | Command | Files | Blocks commit |
|-----|---------|-------|---------------|
| `lint` | `bun run lint` | `*.{ts,tsx}` | Yes |
| `typecheck` | `tsc -b` | `*.{ts,tsx}` | Yes |

- `tsc -b` is a full project typecheck (project references).
- No secrets scanning in pre-commit — `gitleaks` is a Go binary not installable via npm, would add friction for contributors. Secrets are caught in CI instead.

**New devDependencies**: `lefthook`

**Installation for contributors**: `bunx lefthook install` after `bun install`. A `postinstall` script in `package.json` auto-runs it.

**New files**: `lefthook.yml`

## 2. GitHub Actions CI

**One workflow**: `.github/workflows/ci.yml`

**Triggers**: `pull_request` → `main`, `push` → `main`

**Jobs**:

| Job | Command | Depends on | Timeout |
|-----|---------|-----------|---------|
| `lint` | `bun run lint` | none | 2 min |
| `typecheck` | `tsc -b` | none | 3 min |
| `test` | `bun run test:coverage` | lint, typecheck | 5 min |
| `build` | `bun run build` | test | 3 min |
| `secrets` | `gitleaks detect --source .` (via `gitleaks/gitleaks-action@v2`) | none | 1 min |

- Uses `oven-sh/setup-bun@v2`
- Caches `node_modules` via `bun.lock` hash
- `test:coverage` enforces the 80% threshold from `vite.config.ts`
- `lint` and `typecheck` run in parallel; `test` depends on both; `build` depends on `test`. `secrets` runs independently in parallel.

**New files**: `.github/workflows/ci.yml`

## 3. Branch protection (GitHub UI)

Configured manually in repo settings:

- Require status checks: `lint`, `typecheck`, `test`, `build`, `secrets`
- Require 1 approving review
- Require conversation resolution before merge
- Block force push
- Delete head branches after merge

## 4. PR template

`.github/pull_request_template.md` with checklist:

- [ ] `bun run lint` passes
- [ ] `tsc -b` passes
- [ ] `bun run test` passes
- [ ] Added tests for changed features/components
- [ ] Tested on mobile (360px) if UI changed
- [ ] No hardcoded `coordinador_id` (via RLS only)

**New files**: `.github/pull_request_template.md`

## 5. CONTRIBUTING.md

Short guide: setup (`bun install`, `.env`), commands table, conventions summary from AGENTS.md, PR flow.

**New files**: `CONTRIBUTING.md`

## 6. Dependabot

`.github/dependabot.yml`:

- Ecosystem: `npm` (bun uses npm registry)
- Interval: weekly
- Groups: `prod-deps` and `dev-deps` as separate PRs
- Open PR limit: 3

**New files**: `.github/dependabot.yml`

## Files to create

1. `lefthook.yml`
2. `.github/workflows/ci.yml`
3. `.github/pull_request_template.md`
4. `.github/dependabot.yml`
5. `CONTRIBUTING.md`

## Files to modify

1. `package.json` — add `lefthook` to devDependencies, add `"postinstall": "lefthook install"` script
2. `opencode.json` — add new pre-approved commands
