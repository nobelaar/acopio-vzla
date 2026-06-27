# Community Wall + Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a community wall for posts without centro, and a notification system (bell icon + badge + dropdown) for centro coordinators when someone comments on their posts.

**Architecture:** DB trigger auto-creates notifications on comment insert. New `/comunidad` route with its own feed. Bell icon in Navbar with dropdown. Community posts use `centro_id = null` (FK made nullable).

**Tech Stack:** React 18, TypeScript, Tailwind 3, shadcn/ui, Supabase, TanStack React Query v5, lucide-react.

**Spec:** `docs/superpowers/specs/2026-06-27-community-notifications-design.md`

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/00005_notificaciones.sql`

- [ ] **Step 1: Write migration**

```sql
-- Make centro_id nullable for community posts
alter table public.posts
  alter column centro_id drop not null;

-- Notifications table
create table if not exists public.notificacion (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  tipo       text not null default 'comentario' check (tipo = 'comentario'),
  leida      boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notificacion_user
  on public.notificacion (user_id, created_at desc);

alter table public.notificacion enable row level security;

drop policy if exists "notificacion_select_owner" on public.notificacion;
create policy "notificacion_select_owner"
  on public.notificacion for select
  to authenticated
  using ( auth.uid() = user_id );

drop policy if exists "notificacion_update_owner" on public.notificacion;
create policy "notificacion_update_owner"
  on public.notificacion for update
  to authenticated
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- Trigger: auto-create notification when someone comments on a centro post
create or replace function public.notificar_comentario()
returns trigger as $$
declare
  v_coordinador_id uuid;
begin
  -- Only notify if the post belongs to a centro
  select c.coordinador_id into v_coordinador_id
  from public.centros_acopio c
  join public.posts p on p.centro_id = c.id
  where p.id = new.post_id;

  -- Don't notify if coordinator comments on their own post
  if v_coordinador_id is not null and v_coordinador_id != new.user_id then
    insert into public.notificacion (user_id, post_id, tipo)
    values (v_coordinador_id, new.post_id, 'comentario');
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notificar_comentario on public.post_comentario;
create trigger trg_notificar_comentario
  after insert on public.post_comentario
  for each row execute function public.notificar_comentario();
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase db push`

---

### Task 2: Types + Queries + Mutations

**Files:**
- Modify: `src/types/db.ts`
- Create: `src/features/notificaciones/queries.ts`
- Modify: `src/features/posts/queries.ts`
- Modify: `src/features/posts/mutations.ts`

- [ ] **Step 1: Add Notificacion type to db.ts**

```ts
export interface Notificacion {
  id: string
  user_id: string
  post_id: string
  tipo: 'comentario'
  leida: boolean
  created_at: string
}
```

- [ ] **Step 2: Create notifications query hook**

Create `src/features/notificaciones/queries.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Notificacion } from '@/types/db'

export function useNotificaciones(userId: string | undefined) {
  return useQuery<Notificacion[]>({
    queryKey: ['notificaciones', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacion')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as Notificacion[]
    },
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useNotificacionesNoLeidas(userId: string | undefined) {
  return useQuery<number>({
    queryKey: ['notificaciones', userId, 'no-leidas'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notificacion')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('leida', false)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!userId,
    staleTime: 10_000,
  })
}

export function useMarcarTodasLeidas() {
  const qc = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (userId) => {
      const { error } = await supabase
        .from('notificacion')
        .update({ leida: true })
        .eq('user_id', userId)
        .eq('leida', false)
      if (error) throw error
    },
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: ['notificaciones', userId] })
    },
  })
}
```

- [ ] **Step 3: Add community feed query to posts/queries.ts**

```ts
export function useInfinitePostsComunidad() {
  return useInfiniteQuery<PostWithUtil[]>({
    queryKey: ['posts', 'comunidad'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined
      let query = supabase
        .from('posts')
        .select('*')
        .is('centro_id', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      if (cursor) query = query.lt('created_at', cursor)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map(toPostWithUtil) as PostWithUtil[]
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage[lastPage.length - 1]?.created_at
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}
```

- [ ] **Step 4: Make centro_id optional in useCrearPost**

In `src/features/posts/mutations.ts`, change `CrearPostInput`:

```ts
export interface CrearPostInput {
  centro_id?: string
  contenido: string
  foto_url?: string | null
  necesidades?: string[]
}
```

And in the mutationFn:
```ts
        .insert({
          centro_id: input.centro_id ?? null,
          contenido: input.contenido,
          ...
        })
```

The `onSuccess` invalidation for `['posts', variables.centro_id]` will only work when centro_id is present. Add community invalidation:

```ts
    onSuccess: (_data, variables) => {
      if (variables.centro_id) {
        qc.invalidateQueries({ queryKey: ['posts', variables.centro_id] })
      }
      qc.invalidateQueries({ queryKey: ['posts', 'feed'] })
      qc.invalidateQueries({ queryKey: ['posts', 'comunidad'] })
    },
```

---

### Task 3: Notification Bell + Dropdown

**Files:**
- Create: `src/components/notificacion/NotificationBell.tsx`
- Create: `src/components/notificacion/NotificacionItem.tsx`

- [ ] **Step 1: Create NotificacionItem**

Create `src/components/notificacion/NotificacionItem.tsx`:

```tsx
import { Link } from 'react-router-dom'
import type { Notificacion } from '@/types/db'
import { formatDate } from '@/lib/utils'

interface Props {
  notificacion: Notificacion
  onRead: () => void
}

export function NotificacionItem({ notificacion, onRead }: Props) {
  return (
    <Link
      to={`/centro/${notificacion.post_id}`}
      onClick={onRead}
      className="block border-b border-border px-4 py-3 transition-colors hover:bg-secondary/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px]">
            Alguien comento en tu post
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {formatDate(notificacion.created_at)}
          </p>
        </div>
        {!notificacion.leida && (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create NotificationBell**

Create `src/components/notificacion/NotificationBell.tsx`:

```tsx
import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotificaciones, useNotificacionesNoLeidas, useMarcarTodasLeidas } from '@/features/notificaciones/queries'
import { NotificacionItem } from './NotificacionItem'

interface Props {
  userId: string | undefined
}

export function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: notificaciones = [] } = useNotificaciones(userId)
  const { data: noLeidas = 0 } = useNotificacionesNoLeidas(userId)
  const marcarTodas = useMarcarTodasLeidas()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!userId) return null

  function handleToggle() {
    if (!open && noLeidas > 0) {
      marcarTodas.mutate(userId!)
    }
    setOpen(!open)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Bell size={20} />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-80 overflow-hidden rounded-2xl border border-border bg-black shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <span className="text-[15px] font-bold">Notificaciones</span>
          </div>
          <div className="max-h-96 overflow-auto">
            {notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                No tenes notificaciones
              </p>
            ) : (
              <>
                {notificaciones.slice(0, 5).map((n) => (
                  <NotificacionItem
                    key={n.id}
                    notificacion={n}
                    onRead={() => setOpen(false)}
                  />
                ))}
                {notificaciones.length > 5 && (
                  <Link
                    to="/notificaciones"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 text-center text-[13px] text-primary hover:underline"
                  >
                    Ver todas
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

### Task 4: Community Wall Page

**Files:**
- Create: `src/pages/ComunidadPage.tsx`

- [ ] **Step 1: Create ComunidadPage**

```tsx
import { useCallback } from 'react'
import { useInfinitePostsComunidad } from '@/features/posts/queries'
import { useCrearPost } from '@/features/posts/mutations'
import { useSession } from '@/features/auth/session'
import { PostCard } from '@/components/post/PostCard'
import { PostSkeletonList } from '@/components/post/PostSkeleton'
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import type { PostWithUtil } from '@/types/db'
import { useState } from 'react'

export function ComunidadPage() {
  const { user } = useSession()
  const [contenido, setContenido] = useState('')
  const crearPost = useCrearPost()

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfinitePostsComunidad()

  const posts: PostWithUtil[] = data?.pages.flat() ?? []

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const sentinelRef = useIntersectionObserver(loadMore, hasNextPage ?? false)

  function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) return
    crearPost.mutate(
      { contenido: contenido.trim(), necesidades: [] },
      { onSuccess: () => setContenido('') }
    )
  }

  if (isLoading) {
    return <div className="py-4"><PostSkeletonList count={5} /></div>
  }

  return (
    <div className="py-2 pb-14">
      {user ? (
        <form onSubmit={handlePost} className="border-b border-border px-4 py-3">
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={2}
            placeholder="Que queres compartir con la comunidad?"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!contenido.trim() || crearPost.isPending}
              size="sm"
              className="rounded-full px-5"
            >
              {crearPost.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="border-b border-border px-4 py-3 text-[13px] text-muted-foreground">
          Inicia sesion para publicar en la comunidad
        </p>
      )}

      <div className="border-b border-border px-4 py-2">
        <span className="text-[13px] font-semibold text-muted-foreground">Comunidad</span>
      </div>

      {isError && (
        <div className="flex flex-col items-center gap-3 py-16">
          <p className="text-sm text-muted-foreground">No se pudieron cargar las publicaciones.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {!isError && posts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Users size={48} className="text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            Aun no hay publicaciones en la comunidad.
            <br />
            Se el primero en compartir algo.
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} showCentro={false} />
      ))}

      <div ref={sentinelRef} className="py-4 text-center">
        {isFetchingNextPage && <span className="text-sm text-muted-foreground">Cargando mas...</span>}
      </div>
    </div>
  )
}
```

---

### Task 5: Notifications Page

**Files:**
- Create: `src/pages/NotificacionesPage.tsx`

- [ ] **Step 1: Create NotificacionesPage**

```tsx
import { useSession } from '@/features/auth/session'
import { useNotificaciones, useMarcarTodasLeidas } from '@/features/notificaciones/queries'
import { NotificacionItem } from '@/components/notificacion/NotificacionItem'
import { Bell } from 'lucide-react'
import { useEffect } from 'react'

export function NotificacionesPage() {
  const { user } = useSession()
  const { data: notificaciones = [], isLoading } = useNotificaciones(user?.id)
  const marcarTodas = useMarcarTodasLeidas()

  useEffect(() => {
    if (user) marcarTodas.mutate(user.id)
  }, [user])

  if (!user) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Inicia sesion para ver tus notificaciones</p>
  }

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Cargando notificaciones...</p>
  }

  return (
    <div className="pb-14">
      <div className="border-b border-border px-4 py-3">
        <span className="text-[15px] font-bold">Notificaciones</span>
      </div>
      {notificaciones.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Bell size={48} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No tenes notificaciones</p>
        </div>
      ) : (
        notificaciones.map((n) => (
          <NotificacionItem key={n.id} notificacion={n} onRead={() => {}} />
        ))
      )}
    </div>
  )
}
```

---

### Task 6: Update Navigation Components

**Files:**
- Modify: `src/components/layout/MobileBottomBar.tsx`
- Modify: `src/components/layout/DesktopSidebar.tsx`
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update MobileBottomBar — add Comunidad tab**

Change the 4 tabs to 5:
```tsx
import { Users } from 'lucide-react'
```

Add Comunidad tab between Inicio and Buscar:
```tsx
        <Tab to="/comunidad" icon={Users} label="Comunidad" />
```

- [ ] **Step 2: Update DesktopSidebar — add Comunidad + Notificaciones**

Add Comunidad nav item after Inicio:
```tsx
        <SidebarItem to="/comunidad" icon={Users} label="Comunidad" />
```

Add notification bell at the bottom (before or after logout):
```tsx
import { NotificationBell } from '@/components/notificacion/NotificationBell'

// Inside the aside, add before logout:
      <div className="mt-auto">
        <NotificationBell userId={user?.id} />
        {user && (
          <button ... logout button ... />
        )}
      </div>
```

- [ ] **Step 3: Add NotificationBell to Navbar**

In `src/components/layout/Navbar.tsx`, add bell next to the home link. The Navbar currently shows either back arrow or "Acopio" logo. Add the bell to the right:

```tsx
import { NotificationBell } from '@/components/notificacion/NotificationBell'
```

Add `user` prop to Navbar and pass `NotificationBell`:
```tsx
interface Props {
  user?: AuthUser | null
}
```

In the header, after the nav content, add:
```tsx
        <div className="ml-auto">
          <NotificationBell userId={user?.id} />
        </div>
```

- [ ] **Step 4: Update App.tsx — add new routes**

Add imports:
```tsx
import { ComunidadPage } from '@/pages/ComunidadPage'
import { NotificacionesPage } from '@/pages/NotificacionesPage'
```

Add routes:
```tsx
          <Route path="/comunidad" element={<ComunidadPage />} />
          <Route path="/notificaciones" element={<NotificacionesPage />} />
```

Pass `user` to Navbar:
```tsx
      <Navbar user={user} />
```

- [ ] **Step 5: Update HomePage — show Navbar at /centros too**

The Navbar currently hides on `/` and `/centros` only. Update the condition:
```tsx
const isSubPage = location.pathname !== '/' && location.pathname !== '/centros' && location.pathname !== '/comunidad'
```

---

### Task 7: MSW Handlers + Fixtures

**Files:**
- Modify: `src/test/mocks/fixtures.ts`
- Modify: `src/test/mocks/handlers.ts`

- [ ] **Step 1: Add notification fixtures**

```ts
import type { Notificacion } from '@/types/db'

export const fixtureNotificacion: Notificacion = {
  id: 'nnnnnnnn-0000-0000-0000-000000000001',
  user_id: fixtureUser.id,
  post_id: fixturePost.id,
  tipo: 'comentario',
  leida: false,
  created_at: '2025-01-12T14:00:00.000Z',
}
```

- [ ] **Step 2: Add notification MSW handlers**

In `handlers.ts`, update `Store`:
```ts
  notificaciones: Notificacion[]
```

In `makeStore()`:
```ts
    notificaciones: [structuredClone(fixtureNotificacion)],
```

Add handlers before closing `]` of restHandlers:
```ts
  http.get(`${BASE}/rest/v1/notificacion`, ({ request }) => {
    const url = new URL(request.url)
    const { filters, order } = parseQuery(url)
    let rows = applyFilters(store.notificaciones as unknown as Record<string, unknown>[], filters)
    if (order) rows = applyOrder(rows, order, (r) => String(r[order!.column as keyof Notificacion]))
    const limit = url.searchParams.get('limit')
    if (limit) rows = rows.slice(0, parseInt(limit))
    return HttpResponse.json(rows)
  }),

  http.patch(`${BASE}/rest/v1/notificacion`, async ({ request }) => {
    const body = (await request.json()) as Partial<Notificacion>
    store.notificaciones = store.notificaciones.map((n) =>
      body.leida !== undefined ? { ...n, leida: body.leida } : n
    )
    return HttpResponse.json(null, { status: 204 })
  }),
```

---

### Task 8: Verify

**Files:** None

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: builds.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Tests**

Run: `npm test`
Expected: all passing.
