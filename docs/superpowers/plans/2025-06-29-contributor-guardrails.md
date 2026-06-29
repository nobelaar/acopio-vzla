# Contributor Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up automated safeguards (pre-commit, CI, PR template, Dependabot, CONTRIBUTING.md) so external contributors can't break the build, commit secrets, or bypass conventions.

**Architecture:** Pre-commit hooks via lefthook (lint + typecheck on staged files). GitHub Actions CI runs lint, typecheck, test, build, and secrets scanning on every PR/push to main. Branch protection enforced manually in GitHub settings. Dependabot handles dependency bumps weekly.

**Tech Stack:** lefthook, GitHub Actions, gitleaks-action, oven-sh/setup-bun

---

### Task 1: Add lefthook devDependency and postinstall script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install lefthook**

```bash
bun add --dev lefthook
```

- [ ] **Step 2: Add postinstall script to package.json**

Open `package.json` and add `"postinstall": "lefthook install"` to the `scripts` block. The relevant section should look like:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview",
    "postinstall": "lefthook install",
    "test": "vitest run",
```

- [ ] **Step 3: Verify lefthook is available**

```bash
bunx lefthook version
```
Expected: version string output (e.g., `1.x.x`)

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock
git commit -S -m "build: add lefthook for pre-commit hooks"
```

---

### Task 2: Create lefthook.yml

**Files:**
- Create: `lefthook.yml`

- [ ] **Step 1: Create lefthook.yml**

```yaml
pre-commit:
  piped: true
  jobs:
    - name: lint
      glob: "*.{ts,tsx}"
      run: bun run lint {staged_files}
    - name: typecheck
      glob: "*.{ts,tsx}"
      run: tsc -b
```

- [ ] **Step 2: Verify lefthook config is valid**

```bash
bunx lefthook install
bunx lefthook run pre-commit
```
Expected: lint and typecheck both pass (or will run and report results).

- [ ] **Step 3: Commit**

```bash
git add lefthook.yml
git commit -S -m "build: add lefthook pre-commit config (lint + typecheck)"
```

---

### Task 3: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create ci.yml**

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint:
    name: Lint (oxlint)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint

  typecheck:
    name: Typecheck (tsc)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: tsc -b

  test:
    name: Test (vitest + coverage)
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run test:coverage

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build

  secrets:
    name: Secrets scan (gitleaks)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
```

- [ ] **Step 3: Verify YAML syntax**

```bash
cat .github/workflows/ci.yml | python3 -c "import yaml; yaml.safe_load(__import__('sys').stdin.read()); print('OK')"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -S -m "ci: add GitHub Actions workflow (lint, typecheck, test, build, secrets)"
```

---

### Task 4: Create PR template

**Files:**
- Create: `.github/pull_request_template.md`

- [ ] **Step 1: Create pull_request_template.md**

```markdown
## Descripcion

<!-- Explica que hace este cambio y por que -->

## Checklist

- [ ] `bun run lint` pasa
- [ ] `tsc -b` pasa
- [ ] `bun run test` pasa
- [ ] Agregue tests si toque features (`src/features/`) o componentes (`src/components/`)
- [ ] Probe en mobile (360px) si cambie la UI
- [ ] No hardcodee `coordinador_id` (siempre va por RLS desde `auth.uid()`)
```

- [ ] **Step 2: Commit**

```bash
git add .github/pull_request_template.md
git commit -S -m "docs: add PR template with contribution checklist"
```

---

### Task 5: Create CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Create CONTRIBUTING.md**

```markdown
# Contribuir a Acopio

Gracias por querer ayudar. Acopio es una plataforma de ayuda humanitaria open-source
construida con React 18, Supabase, TanStack Query y Tailwind CSS.

## Setup rapido

```bash
bun install
cp .env.example .env   # completa con tus credenciales de Supabase
bun run dev             # http://localhost:5173
```

## Comandos

| Comando | Que hace |
|---------|----------|
| `bun run dev` | Servidor de desarrollo (Vite HMR) |
| `bun run build` | Typecheck + build de produccion |
| `bun run test` | Corre todos los tests |
| `bun run test:watch` | Tests en modo watch |
| `bun run lint` | Linter (oxlint) |
| `bun run supabase:push` | Aplica migraciones al remoto |

## Antes de abrir un PR

1. **Lint**: `bun run lint`
2. **Typecheck**: `tsc -b`
3. **Tests**: `bun run test`
4. **Build**: `bun run build`

El CI en GitHub Actions corre todo esto automaticamente y bloquea el merge si algo falla.

## Convenciones

- **Idioma**: todo el codigo (funciones, variables, componentes, UI) va en espanol
- **Package manager**: solo Bun (`bun install`, `bun run`, `bun add`). Nada de npm/yarn/pnpm.
- **Autenticacion**: `coordinador_id` siempre viene de `auth.uid()` via RLS, nunca del frontend
- **Estilo**: shadcn/ui + Tailwind. Componentes con `React.forwardRef` y `cn()` de `@/lib/utils`
- **Tests**: Vitest + MSW. Usar `renderWithProviders` de `@/test/test-utils`
- **Mobile-first**: minimo 360px de ancho

## Flujo de PR

1. Hace un fork del repo
2. Crea una branch con nombre descriptivo (`fix/...`, `feat/...`, `refactor/...`)
3. Hace tus cambios con tests
4. Asegurate de que `bun run lint`, `tsc -b`, y `bun run test` pasen
5. Abri un PR contra `main`
6. El CI va a correr automaticamente. Si algo falla, revisa los logs.
7. Un maintainer revisara tu PR
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -S -m "docs: add CONTRIBUTING.md for external contributors"
```

---

### Task 6: Create Dependabot config

**Files:**
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Create dependabot.yml**

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 3
    groups:
      prod-deps:
        dependency-type: "production"
      dev-deps:
        dependency-type: "development"
```

- [ ] **Step 2: Verify YAML syntax**

```bash
cat .github/dependabot.yml | python3 -c "import yaml; yaml.safe_load(__import__('sys').stdin.read()); print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .github/dependabot.yml
git commit -S -m "ci: add Dependabot config for weekly npm bumps"
```

---

### Task 7: Update opencode.json permissions

**Files:**
- Modify: `opencode.json`

- [ ] **Step 1: Add lefthook commands to opencode.json**

Open `opencode.json`. Add `"bunx lefthook *"` and `"bun run postinstall"` to the `permissions.allow` array. The array should include:

```json
"bun run postinstall",
"bunx lefthook *",
"bunx lefthook install",
```

- [ ] **Step 2: Verify JSON is valid**

```bash
cat opencode.json | python3 -c "import json; json.load(__import__('sys').stdin); print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add opencode.json
git commit -S -m "chore: add lefthook commands to opencode pre-approved list"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run full verification locally**

```bash
bun run lint && tsc -b && bun run test
```
Expected: all three pass with no errors.

- [ ] **Step 2: Verify lefthook is configured**

```bash
ls -la .git/hooks/pre-commit
```
Expected: symlink exists pointing to lefthook.

- [ ] **Step 3: Commit final state**

```bash
git status
```
All files should be committed. If any changes remain, commit them.
