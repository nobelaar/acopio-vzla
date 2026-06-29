# AGENTS.md — Acopio

Humanitarian aid platform (React 18 SPA + Supabase backend). Mobile-first, public by default.

## Package manager

**Bun only.** Never use npm, yarn, or pnpm. All scripts in `package.json` use `bun run`.

| Command                | What it does                          |
|------------------------|---------------------------------------|
| `bun run dev`          | Vite dev server (HMR)                 |
| `bun run build`        | `tsc -b && vite build` (typecheck first, then bundle) |
| `bun run test`         | Vitest run (single pass)              |
| `bun run test:watch`   | Vitest watch mode                     |
| `bun run test:coverage`| Vitest + v8 coverage                  |
| `bun run lint`         | oxlint (not ESLint)                   |

**Build requires `tsc -b` first** — the project uses TypeScript project references (`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`). Skipping the typecheck step breaks the build.

## Architecture

```
src/
├── main.tsx         # QueryClientProvider + BrowserRouter + ThemeProvider
├── App.tsx          # Routes (react-router-dom) + Navbar + BottomBar + Sidebar
├── lib/             # supabase client, storage, utils, constants, theme
│   └── hooks/       # shared hooks (useToast, useIntersectionObserver)
├── features/        # TanStack Query hooks per domain (queries, mutations, realtime)
│   ├── auth/session.ts
│   ├── centros/{queries,mutations}.ts
│   ├── posts/{queries,mutations,realtime,realtime-feed,comentarios-*}.ts
│   ├── anuncios/{queries,mutations,realtime}.ts
│   └── notificaciones/queries.ts
├── components/
│   ├── ui/          # shadcn/ui primitives (Button, Card, Input)
│   ├── layout/      # Navbar, MobileBottomBar, DesktopSidebar, ProtectedRoute
│   ├── centro/
│   ├── post/
│   ├── anuncio/
│   ├── common/      # FotoUploader, NecesidadesSelector, SearchBar, SearchOverlay
│   ├── toast/
│   └── notificacion/
├── pages/           # Top-level route components, co-located *.test.tsx
├── types/db.ts      # All DB interfaces (CentroAcopio, Post, Anuncio, FeedItem, etc.)
└── test/
    ├── setup.ts     # MSW server lifecycle + localStorage reset + URL mock
    ├── test-utils.tsx  # renderWithProviders (QueryClient + MemoryRouter)
    └── mocks/       # MSW handlers, fixtures, server
```

- **No global state library** (no Redux, Zustand). Server state = TanStack Query. The only context is ThemeProvider (light/dark).
- **No custom user table.** Auth is entirely Supabase GoTrue. `coordinador_id` always comes from `auth.uid()` via RLS — never from form input or client code.
- **RLS is the single source of truth** for authorization. No frontend auth middleware beyond `<ProtectedRoute>`.
- **Toast system is global**, not context-based. Import `addToast` from `@/lib/hooks/useToast` and call `addToast(message, 'success'|'error'|'info')`. No provider needed. Auto-dismisses after 3 seconds.
- **"Util" system**: posts, comments, and anuncios have a "helpful" toggle. Each domain has `useToggle*Util()` mutation with optimistic cache updates. Types suffixed `*WithUtil` add `util_count` + `user_has_util` fields.
- **Infinite scroll**: cursor-based pagination via `created_at` in `useInfiniteQuery` hooks. The `useIntersectionObserver` hook from `@/lib/hooks/useIntersectionObserver` provides a sentinel ref to trigger `fetchNextPage`.
- **Feed is a union**: `FeedItem` type (`{ kind: 'post' | 'anuncio', data: ... }`) powers the combined feed on `/`.

## Key conventions

### Naming
- **Code is in Spanish**: function names, variables, components, and UI text are all Spanish (`comprimirImagen`, `useCrearCentro`, `necesidades`, `centros_acopio`). Do NOT translate them to English.
- Only external API/types/imports use English (Supabase JS client, React, TanStack Query).

### Imports
- Path alias `@/` → `src/` (configured in `tsconfig.app.json` and `vite.config.ts`)
- Use `@/lib/supabase`, `@/types/db`, `@/components/...`, `@/features/...`

### Components
- shadcn/ui pattern: `React.forwardRef`, `cva` variants via `class-variance-authority`, `cn()` from `@/lib/utils`
- UI primitives in `src/components/ui/` are excluded from coverage
- Pages import from `@/features/` for data hooks, `@/components/` for presentation

### Features (data hooks)
- Each domain has `queries.ts`, `mutations.ts`, and optionally `realtime.ts`
- TanStack Query config: `staleTime: 30s`, `gcTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false` (set in `main.tsx`)
- Realtime subscriptions use `supabase.channel(...).on('postgres_changes', ...)` and always clean up on unmount

### Styling
- Tailwind CSS with shadcn/ui CSS variables (HSL colors)
- Dark mode via class strategy (`dark` class on `<html>`)
- Theme persisted in `localStorage` key `saman-theme`
- Mobile-first: 360px minimum width

## Testing

- **Vitest** with `globals: true` (no need to import `describe`/`it`/`expect`)
- **jsdom** environment, **MSW** mocks all Supabase calls
- `renderWithProviders` wraps in QueryClient + MemoryRouter
- Tests co-located as `*.test.tsx` next to their subject
- MSW server auto-starts in `setup.ts`, resets handlers between tests
- MSW uses an in-memory mutable `store` across handlers. `resetStore()` resets it between tests. `setRequireEmailConfirm(boolean)` controls email confirmation flow in tests.
- Coverage threshold: **80%** on `src/features/**` and `src/components/**` (excluding `ui/`)
- `createObjectURL`/`revokeObjectURL` are polyfilled in test setup

## Supabase schema & migrations

- Migrations live in `supabase/migrations/` and are versioned
- `bun run supabase:push` applies pending migrations to remote
- `bun run supabase:diff <name>` generates a new migration from local→remote diffs
- `bun run supabase:types` regenerates TypeScript types from remote schema → `src/types/database.generated.ts`
- The Supabase CLI is a devDependency; use via `bunx supabase` or `bun run supabase:*`
- Local config: `supabase/config.toml`

## External services

- **Supabase Storage**: bucket `centros-fotos` is public, photos compressed client-side to ~1MB before upload
- **Google Maps**: link-out only (`https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`), no embedded maps
