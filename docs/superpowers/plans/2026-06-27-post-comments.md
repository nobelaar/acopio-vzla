# Post Comments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add inline expandable comments with independent "Útil" reactions to every post.

**Architecture:** Two new tables (`post_comentario`, `comentario_util`) with RLS. New query/mutation hooks following existing patterns. New `ComentarioItem` and `ComentarioForm` components. PostCard gains expandable comments section with lazy fetch.

**Tech Stack:** React 18, TypeScript, Tailwind 3, shadcn/ui, Supabase, TanStack React Query v5, lucide-react.

**Spec:** `docs/superpowers/specs/2026-06-27-post-comments-design.md`

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/00004_comentarios.sql`

- [ ] **Step 1: Write migration**

```sql
create table if not exists public.post_comentario (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  contenido  text not null check (char_length(contenido) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_comentario_post_created
  on public.post_comentario (post_id, created_at asc);

create table if not exists public.comentario_util (
  id            uuid primary key default gen_random_uuid(),
  comentario_id uuid not null references public.post_comentario (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (comentario_id, user_id)
);

create index if not exists idx_comentario_util_comentario
  on public.comentario_util (comentario_id);

alter table public.post_comentario enable row level security;
alter table public.comentario_util enable row level security;

drop policy if exists "comentario_select_publico" on public.post_comentario;
create policy "comentario_select_publico"
  on public.post_comentario for select
  using ( true );

drop policy if exists "comentario_insert_auth" on public.post_comentario;
create policy "comentario_insert_auth"
  on public.post_comentario for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "comentario_util_select_publico" on public.comentario_util;
create policy "comentario_util_select_publico"
  on public.comentario_util for select
  using ( true );

drop policy if exists "comentario_util_insert_auth" on public.comentario_util;
create policy "comentario_util_insert_auth"
  on public.comentario_util for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "comentario_util_delete_owner" on public.comentario_util;
create policy "comentario_util_delete_owner"
  on public.comentario_util for delete
  to authenticated
  using ( auth.uid() = user_id );
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase db push`
Expected: migration applied successfully.

---

### Task 2: TypeScript Types

**Files:**
- Modify: `src/types/db.ts`

- [ ] **Step 1: Add types at end of db.ts**

```ts
export interface PostComentario {
  id: string
  post_id: string
  user_id: string
  contenido: string
  created_at: string
}

export interface ComentarioUtil {
  id: string
  comentario_id: string
  user_id: string
  created_at: string
}

export interface ComentarioWithUtil extends PostComentario {
  util_count: number
  user_has_util: boolean
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 3: Comments Query Hook

**Files:**
- Create: `src/features/posts/comentarios-queries.ts`

- [ ] **Step 1: Write useComentarios hook**

```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ComentarioWithUtil } from '@/types/db'

export function useComentarios(postId: string, enabled = true) {
  return useQuery<ComentarioWithUtil[]>({
    queryKey: ['comentarios', postId],
    queryFn: async () => {
      const { data: comentarios, error } = await supabase
        .from('post_comentario')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      if (!comentarios?.length) return []

      const { data: utils, error: utilError } = await supabase
        .from('comentario_util')
        .select('comentario_id')

      if (utilError) throw utilError

      const utilCounts = new Map<string, number>()
      for (const u of (utils ?? [])) {
        utilCounts.set(u.comentario_id, (utilCounts.get(u.comentario_id) ?? 0) + 1)
      }

      const { data: { user } } = await supabase.auth.getUser()

      return comentarios.map((c) => ({
        ...c,
        util_count: utilCounts.get(c.id) ?? 0,
        user_has_util: false,
      })) as ComentarioWithUtil[]
    },
    enabled: !!postId && enabled,
    staleTime: 30_000,
  })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 4: Comments Mutation Hooks

**Files:**
- Create: `src/features/posts/comentarios-mutations.ts`

- [ ] **Step 1: Write mutations**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ComentarioWithUtil, PostComentario } from '@/types/db'

interface CrearComentarioInput {
  postId: string
  contenido: string
}

export function useCrearComentario() {
  const qc = useQueryClient()
  return useMutation<PostComentario, Error, CrearComentarioInput>({
    mutationFn: async ({ postId, contenido }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesion para comentar')
      const { data, error } = await supabase
        .from('post_comentario')
        .insert({ post_id: postId, contenido, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as PostComentario
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['comentarios', variables.postId] })
    },
  })
}

export function useToggleComentarioUtil() {
  const qc = useQueryClient()
  return useMutation<void, Error, { comentarioId: string; postId: string; active: boolean }>({
    mutationFn: async ({ comentarioId, active }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesion')
      if (active) {
        const { error } = await supabase
          .from('comentario_util')
          .delete()
          .eq('comentario_id', comentarioId)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('comentario_util')
          .insert({ comentario_id: comentarioId, user_id: user.id })
        if (error) throw error
      }
    },
    onMutate: async ({ comentarioId, postId, active }) => {
      await qc.cancelQueries({ queryKey: ['comentarios', postId] })
      const prev = qc.getQueryData<ComentarioWithUtil[]>(['comentarios', postId])
      qc.setQueryData<ComentarioWithUtil[]>(['comentarios', postId], (old) =>
        (old ?? []).map((c) =>
          c.id === comentarioId
            ? {
                ...c,
                user_has_util: !active,
                util_count: active ? Math.max(0, c.util_count - 1) : c.util_count + 1,
              }
            : c
        )
      )
      return { prev }
    },
    onError: (_err, variables, context) => {
      if (context?.prev) {
        qc.setQueryData(['comentarios', variables.postId], context.prev)
      }
    },
  })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 5: ComentarioForm Component

**Files:**
- Create: `src/components/post/ComentarioForm.tsx`

- [ ] **Step 1: Write component**

```tsx
import { useState } from 'react'
import { useCrearComentario } from '@/features/posts/comentarios-mutations'
import type { AuthUser } from '@/types/db'

interface Props {
  postId: string
  user: AuthUser | null
}

export function ComentarioForm({ postId, user }: Props) {
  const [contenido, setContenido] = useState('')
  const crear = useCrearComentario()

  if (!user) {
    return (
      <p className="border-b border-border px-4 py-2 text-[13px] text-muted-foreground">
        Inicia sesion para comentar
      </p>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) return
    crear.mutate(
      { postId, contenido: contenido.trim() },
      { onSuccess: () => setContenido('') }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-b border-border px-4 py-2">
      <input
        type="text"
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder="Escribi un comentario..."
        maxLength={500}
        className="min-w-0 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button
        type="submit"
        disabled={!contenido.trim() || crear.isPending}
        className="shrink-0 text-[14px] font-semibold text-primary disabled:opacity-40"
      >
        {crear.isPending ? '...' : 'Enviar'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 6: ComentarioItem Component

**Files:**
- Create: `src/components/post/ComentarioItem.tsx`

- [ ] **Step 1: Write component**

```tsx
import type { ComentarioWithUtil } from '@/types/db'
import { formatDate } from '@/lib/utils'
import { Heart } from 'lucide-react'
import { useToggleComentarioUtil } from '@/features/posts/comentarios-mutations'
import { addToast } from '@/lib/hooks/useToast'

interface Props {
  comentario: ComentarioWithUtil
  postId: string
}

export function ComentarioItem({ comentario, postId }: Props) {
  const toggleUtil = useToggleComentarioUtil()

  function handleUtil() {
    toggleUtil.mutate(
      {
        comentarioId: comentario.id,
        postId,
        active: comentario.user_has_util,
      },
      {
        onError: (err) => {
          addToast(err.message || 'No se pudo registrar', 'error')
        },
      }
    )
  }

  return (
    <div className="border-b border-border px-4 py-2">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="font-medium text-muted-foreground">
          {truncateEmail(comentario.user_id)}
        </span>
        <span className="text-muted-foreground/60">·</span>
        <time dateTime={comentario.created_at} className="text-muted-foreground/60">
          {formatDate(comentario.created_at)}
        </time>
      </div>
      <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed">
        {comentario.contenido}
      </p>
      <button
        type="button"
        onClick={handleUtil}
        disabled={toggleUtil.isPending}
        className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
      >
        <Heart
          size={14}
          className={comentario.user_has_util ? 'fill-primary text-primary' : ''}
        />
        <span>{comentario.util_count}</span>
      </button>
    </div>
  )
}

function truncateEmail(userId: string): string {
  return userId.length > 8 ? `${userId.slice(0, 8)}...` : userId
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 7: PostCard Comments Section

**Files:**
- Modify: `src/components/post/PostCard.tsx`

- [ ] **Step 1: Add comments to PostCard**

Add imports:
```tsx
import { useState } from 'react'
import { Heart, Share, MessageCircle } from 'lucide-react'
import { useComentarios } from '@/features/posts/comentarios-queries'
import { ComentarioItem } from './ComentarioItem'
import { ComentarioForm } from './ComentarioForm'
```

After the `useToggleUtil()` line, add:
```tsx
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const { data: comentarios = [] } = useComentarios(post.id, commentsOpen)
```

Between the "Útil" button and "Share" button, add the comments button:
```tsx
        <button
          type="button"
          onClick={() => setCommentsOpen(!commentsOpen)}
          className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <MessageCircle size={18} />
          {comentarios.length > 0 && <span>{comentarios.length}</span>}
        </button>
```

After the action buttons div (before the closing `</article>`), add:
```tsx
      {commentsOpen && (
        <div className="mt-2 -mx-4 border-t border-border">
          <ComentarioForm postId={post.id} user={null} />
          {comentarios.length === 0 && (
            <p className="px-4 py-3 text-[13px] text-muted-foreground">
              Se el primero en comentar
            </p>
          )}
          {comentarios
            .slice(0, showAllComments ? undefined : 2)
            .map((c) => (
              <ComentarioItem key={c.id} comentario={c} postId={post.id} />
            ))}
          {!showAllComments && comentarios.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllComments(true)}
              className="w-full px-4 py-2 text-left text-[13px] text-primary hover:underline"
            >
              Ver los {comentarios.length} comentarios
            </button>
          )}
        </div>
      )}
```

**IMPORTANT:** PostCard currently doesn't receive `user` prop. The `ComentarioForm` needs the user to know if someone is logged in. We need to either:
- Add `user: AuthUser | null` to PostCard props, or
- Use `useSession()` inside PostCard

Let's use `useSession()` to avoid prop drilling. Add:
```tsx
import { useSession } from '@/features/auth/session'
```

And inside the component:
```tsx
  const { user } = useSession()
```

Then pass `user` to `ComentarioForm`:
```tsx
          <ComentarioForm postId={post.id} user={user} />
```

- [ ] **Step 2: Full modified PostCard**

For reference, the complete PostCard after all changes should be:

```tsx
import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PostWithUtil } from '@/types/db'
import { formatDate } from '@/lib/utils'
import { Heart, Share, MessageCircle } from 'lucide-react'
import { useToggleUtil } from '@/features/posts/mutations'
import { useComentarios } from '@/features/posts/comentarios-queries'
import { useSession } from '@/features/auth/session'
import { ComentarioItem } from './ComentarioItem'
import { ComentarioForm } from './ComentarioForm'
import { addToast } from '@/lib/hooks/useToast'

interface Props {
  post: PostWithUtil
  centroNombre?: string
  centroCiudad?: string
  showCentro?: boolean
}

export const PostCard = memo(function PostCard({ post, centroNombre, centroCiudad, showCentro = false }: Props) {
  const toggleUtil = useToggleUtil()
  const { user } = useSession()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const { data: comentarios = [] } = useComentarios(post.id, commentsOpen)

  function handleUtil() {
    toggleUtil.mutate(
      { postId: post.id, active: post.user_has_util },
      {
        onError: (err) => {
          addToast(err.message || 'No se pudo registrar', 'error')
        },
      }
    )
  }

  function handleShare() {
    const url = `${window.location.origin}/centro/${post.centro_id}`
    if (navigator.share) {
      navigator.share({ title: 'Publicacion de Acopio', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  return (
    <article className="border-b border-border px-4 py-3 transition-colors hover:bg-secondary/30 active:bg-secondary/50">
      {showCentro && centroNombre && (
        <Link
          to={`/centro/${post.centro_id}`}
          className="mb-1 flex items-center gap-2"
        >
          <span className="text-[15px] font-bold leading-tight tracking-[-0.3px] text-primary hover:underline">
            {centroNombre}
          </span>
          {centroCiudad && (
            <span className="text-[13px] text-muted-foreground">@{centroCiudad}</span>
          )}
        </Link>
      )}

      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
        <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
      </div>

      {post.foto_url && (
        <img
          src={post.foto_url}
          alt="Foto del post"
          loading="lazy"
          decoding="async"
          className="mt-2 w-full rounded-2xl border border-border object-cover"
        />
      )}

      {post.contenido && (
        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{post.contenido}</p>
      )}

      {post.necesidades.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.necesidades.map((n) => (
            <span
              key={n}
              className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {n}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-6">
        <button
          type="button"
          onClick={handleUtil}
          disabled={toggleUtil.isPending}
          className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
        >
          <Heart
            size={18}
            className={post.user_has_util ? 'fill-primary text-primary' : ''}
          />
          <span>{post.util_count}</span>
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen(!commentsOpen)}
          className="group flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <MessageCircle size={18} />
          {comentarios.length > 0 && <span>{comentarios.length}</span>}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <Share size={18} />
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-2 -mx-4 border-t border-border">
          <ComentarioForm postId={post.id} user={user} />
          {comentarios.length === 0 && !commentsOpen && null}
          {commentsOpen && comentarios.length === 0 && (
            <p className="px-4 py-3 text-[13px] text-muted-foreground">
              Se el primero en comentar
            </p>
          )}
          {comentarios
            .slice(0, showAllComments ? undefined : 2)
            .map((c) => (
              <ComentarioItem key={c.id} comentario={c} postId={post.id} />
            ))}
          {!showAllComments && comentarios.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllComments(true)}
              className="w-full px-4 py-2 text-left text-[13px] text-primary hover:underline"
            >
              Ver los {comentarios.length} comentarios
            </button>
          )}
        </div>
      )}
    </article>
  )
})
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: builds.

---

### Task 8: MSW Handlers + Fixtures

**Files:**
- Modify: `src/test/mocks/fixtures.ts`
- Modify: `src/test/mocks/handlers.ts`

- [ ] **Step 1: Add fixtures**

```ts
import type { PostComentario, ComentarioUtil } from '@/types/db'

export const fixtureComentario: PostComentario = {
  id: 'cccccccc-0000-0000-0000-000000000001',
  post_id: fixturePost.id,
  user_id: fixtureUser.id,
  contenido: 'Gracias por la info, voy a llevar agua manana.',
  created_at: '2025-01-12T13:00:00.000Z',
}

export const fixtureComentarioUtil: ComentarioUtil = {
  id: 'uuuuuuuu-0000-0000-0000-000000000002',
  comentario_id: fixtureComentario.id,
  user_id: fixtureUser.id,
  created_at: '2025-01-12T13:05:00.000Z',
}
```

- [ ] **Step 2: Add MSW handlers**

In `handlers.ts`, update `Store` interface:
```ts
interface Store {
  centros: CentroAcopio[]
  posts: Post[]
  postUtils: PostUtil[]
  comentarios: PostComentario[]
  comentarioUtils: ComentarioUtil[]
}
```

Update `makeStore()`:
```ts
    comentarios: [structuredClone(fixtureComentario)],
    comentarioUtils: [structuredClone(fixtureComentarioUtil)],
```

Add `resetStore` update:
```ts
  store.comentarios = [structuredClone(fixtureComentario)]
  store.comentarioUtils = [structuredClone(fixtureComentarioUtil)]
```

Add to `restHandlers` array before the closing `]`:
```ts
  http.get(`${BASE}/rest/v1/post_comentario`, ({ request }) => {
    const url = new URL(request.url)
    const { filters, order } = parseQuery(url)
    let rows = applyFilters(store.comentarios as unknown as Record<string, unknown>[], filters)
    if (order) rows = applyOrder(rows, order, (r) => String(r[order!.column as keyof PostComentario]))
    return HttpResponse.json(rows)
  }),

  http.post(`${BASE}/rest/v1/post_comentario`, async ({ request }) => {
    const body = (await request.json()) as Partial<PostComentario>
    const created: PostComentario = {
      id: crypto.randomUUID(),
      post_id: body.post_id ?? '',
      user_id: body.user_id ?? '',
      contenido: body.contenido ?? '',
      created_at: new Date().toISOString(),
    }
    store.comentarios.push(created)
    return HttpResponse.json(created)
  }),

  http.get(`${BASE}/rest/v1/comentario_util`, ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseQuery(url)
    let rows = applyFilters(store.comentarioUtils as unknown as Record<string, unknown>[], filters)
    return HttpResponse.json(rows)
  }),

  http.post(`${BASE}/rest/v1/comentario_util`, async ({ request }) => {
    const body = (await request.json()) as Partial<ComentarioUtil>
    const created: ComentarioUtil = {
      id: crypto.randomUUID(),
      comentario_id: body.comentario_id ?? '',
      user_id: body.user_id ?? '',
      created_at: new Date().toISOString(),
    }
    store.comentarioUtils.push(created)
    return HttpResponse.json(created)
  }),

  http.delete(`${BASE}/rest/v1/comentario_util`, ({ request }) => {
    const url = new URL(request.url)
    const { filters } = parseQuery(url)
    store.comentarioUtils = store.comentarioUtils.filter(
      (cu) => !(filters.comentario_id && cu.comentario_id === filters.comentario_id)
    )
    return HttpResponse.json(null, { status: 204 })
  }),
```

Add imports:
```ts
import type { CentroAcopio, Post, PostUtil, PostComentario, ComentarioUtil } from '@/types/db'
```
and
```ts
  fixtureComentario,
  fixtureComentarioUtil,
```

---

### Task 9: Update PostCard Test

**Files:**
- Modify: `src/components/post/PostCard.test.tsx`

- [ ] **Step 1: Update test to handle new behavior**

The existing PostCard test renders with showCentro=true and centroNombre. The new PostCard adds `useSession()` and `useComentarios()`. The MSW auth handlers should handle `getUser()` since the test already signs out in beforeEach. 

No changes needed to existing tests — the new queries only fire when `commentsOpen` is true (default false). Let's verify:

Run: `npm test -- src/components/post/PostCard.test.tsx`

---

### Task 10: Verify

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

- [ ] **Step 4: Coverage**

Run: `npm run test:coverage`
Expected: meets 80% threshold.
