# Post Comments — Design Spec

## Summary

Add inline comments to posts with independent "Útil" reactions per comment. Comments expand inline below each post in the feed and profile pages. Only authenticated users can comment and react.

## Architecture

**New Supabase tables:**
- `post_comentario` — id, post_id (FK→posts), user_id (FK→auth.users), contenido (max 500 chars), created_at
- `comentario_util` — id, comentario_id (FK→post_comentario), user_id (FK→auth.users), created_at, unique(comentario_id, user_id)

**New TypeScript types:**
- `PostComentario` — matches post_comentario row
- `ComentarioUtil` — matches comentario_util row
- `ComentarioWithUtil` — extends PostComentario with `util_count: number, user_has_util: boolean`

**New feature hooks:**
- `useComentarios(postId)` — fetches comments with util counts for a post
- `useCrearComentario()` — insert mutation, invalidates comment query
- `useToggleComentarioUtil()` — toggle util on comment, optimistic update

**New components:**
- `ComentarioItem` — single comment row: author email (truncated), timestamp, content, util button
- `ComentarioForm` — text input + submit button, only for authenticated users

**Modified components:**
- `PostCard` — adds comment button (MessageCircle icon) + counter, expandable comments section

**Files:**
```
supabase/migrations/00004_comentarios.sql  (CREATE)
src/types/db.ts                             (MODIFY)
src/features/posts/comentarios-queries.ts   (CREATE)
src/features/posts/comentarios-mutations.ts (CREATE)
src/components/post/ComentarioItem.tsx       (CREATE)
src/components/post/ComentarioForm.tsx       (CREATE)
src/components/post/PostCard.tsx            (MODIFY)
src/test/mocks/fixtures.ts                  (MODIFY)
src/test/mocks/handlers.ts                  (MODIFY)
```

## Behavior

### PostCard comments section

- PostCard shows a "Comments" button (`MessageCircle` icon) between "Útil" and "Share"
- Counter shows total comment count (fetched with post data or via separate count)
- Tapping the button toggles an expandable section below the post content
- When expanded:
  - If user is authenticated: shows `ComentarioForm` (text input + "Enviar" button)
  - If user is NOT authenticated: shows "Inicia sesion para comentar" text
  - Shows the 2 most recent comments
  - If more than 2 comments exist: shows "Ver los N comentarios" link to expand all
- Comments are fetched lazily (only when expanded, to save queries)
- New comments appear immediately via cache update (not realtime)

### ComentarioItem

- Author: email truncated to first 8 chars (e.g., `ana@x.com` → `ana@x...`)
- Timestamp: `formatDate()` relative
- Content: text-sm whitespace-pre-line
- Util button: small heart (14px) + count, same pattern as post util
- Optimistic update on util toggle

### ComentarioForm

- Text input placeholder "Escribi un comentario..."
- Submit button "Enviar" disabled when empty
- On submit: calls useCrearComentario mutation
- Resets input after success
- Optimistic: new comment appears in list immediately

### No realtime

Comments are fetched on expansion and refetch on mutation success. No Supabase Realtime channel — simpler, fewer connections.

## Edge Cases

- **No comments:** "Se el primero en comentar" message
- **Not authenticated:** Form shows login prompt instead of input
- **Empty comment:** Submit button disabled
- **Deleted post:** CASCADE deletes all comments
- **Deleted comment:** CASCADE deletes all comentario_util rows
- **500 char limit:** Enforced by DB CHECK constraint

## RLS Policies

```sql
-- post_comentario: read public, insert authenticated (own user_id)
-- comentario_util: read public, insert authenticated (own user_id), delete authenticated (own user_id)
```

## Implementation Order

1. Migration (00004_comentarios.sql)
2. Types (db.ts)
3. Queries (comentarios-queries.ts)
4. Mutations (comentarios-mutations.ts)
5. ComentarioForm component
6. ComentarioItem component
7. PostCard modifications
8. MSW fixtures + handlers
9. Tests
10. Verify build + tests
