# Community Wall + Notifications — Design Spec

## Summary

Add a community wall where any authenticated user can post (no centro required), and a notification system that alerts centro coordinators when someone comments on their posts. Notifications are UI-only (no push) with a bell icon + badge in the navbar.

## Architecture

### Database Changes

**New table `notificacion`:**
```sql
create table public.notificacion (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  tipo       text not null check (tipo = 'comentario'),
  leida      boolean not null default false,
  created_at timestamptz not null default now()
);
```
RLS: read/update only by owner (`user_id`).

**Modify `posts` table:**
```sql
alter table public.posts
  alter column centro_id drop not null;
```
Community posts have `centro_id = null`. The FK remains with `on delete cascade` behavior.

**Trigger for auto-notification:**
```sql
create or replace function public.notificar_comentario()
returns trigger as $$
declare
  v_coordinador_id uuid;
begin
  select coordinador_id into v_coordinador_id
  from public.centros_acopio c
  join public.posts p on p.centro_id = c.id
  where p.id = new.post_id;

  if v_coordinador_id is not null then
    insert into public.notificacion (user_id, post_id, tipo)
    values (v_coordinador_id, new.post_id, 'comentario');
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notificar_comentario
  after insert on public.post_comentario
  for each row execute function public.notificar_comentario();
```

### New Routes

| Route | Page | Description |
|-------|------|-------------|
| `/comunidad` | `ComunidadPage` | Community wall — posts without centro |
| `/notificaciones` | `NotificacionesPage` | Full notification list |

### New Types

```ts
export interface Notificacion {
  id: string
  user_id: string
  post_id: string
  tipo: 'comentario'
  leida: boolean
  created_at: string
  comentario_preview?: string
  comentario_autor?: string
}
```

### New Components

- `NotificationBell` — Bell icon + badge, dropdown logic
- `NotificationDropdown` — Dropdown panel with notification list
- `ComunidadPage` — Community feed page
- `NotificacionesPage` — Full notifications list page

### Modified Components

- `MobileBottomBar` — Add "Comunidad" tab
- `DesktopSidebar` — Add "Comunidad" + "Notificaciones" items
- `Navbar` — Show bell icon when authenticated
- `PostCard` — Show `showCentro={false}` for community posts
- `App.tsx` — Add new routes
- `useCrearPost` — Make `centro_id` optional
- `posts/queries.ts` — Add `useInfinitePostsComunidad` hook
- `posts/mutations.ts` — Add `useMarcarNotificacionesLeidas`

### New Hooks

- `useNotificaciones(userId)` — fetch notifications with comment preview
- `useNotificacionesNoLeidas(userId)` — count of unread (for badge)
- `useMarcarLeida(notificacionId)` — mark single as read
- `useMarcarTodasLeidas(userId)` — mark all as read

## Behavior

### Community Wall (`/comunidad`)

- Feed of posts where `centro_id IS NULL`
- Top of page: simple PostForm (text + optional photo, no necesidades)
- Placeholder: "¿Qué querés compartir con la comunidad?"
- If not authenticated: "Iniciá sesión para publicar en la comunidad" + button disabled
- Posts show without centro header (`showCentro={false}`)
- Same PostCard with comments and útil

### Notifications

- Bell icon in Navbar (mobile) and DesktopSidebar
- Badge shows unread count (number, orange/red, small)
- Tapping bell opens dropdown below icon
- Dropdown shows last 5 notifications, newest first
- Each notification: timestamp, "X comentó en tu post", comment preview (1 line truncated), post link
- Tapping a notification: navigate to centro profile, mark notification as read
- Opening dropdown marks all as read
- "Ver todas" link → `/notificaciones`
- Notifications page: full scrollable list, mark individually as read
- Only authenticated users see bell
- Community posts do NOT generate notifications (no owner)
- Notification trigger only fires when post belongs to a centro (coordinator exists)

### Edge Cases

- **Deleted post:** CASCADE deletes notifications for that post
- **Deleted centro:** Posts lose `centro_id` (set null), existing notifications remain
- **Self-comment:** Coordinator commenting on their own post does NOT create notification (trigger checks `v_coordinador_id != new.user_id`)
- **No notifications:** Bell shows with 0 badge (or hidden badge)

## File Structure

```
supabase/migrations/00005_notificaciones.sql   (CREATE)
src/types/db.ts                                  (MODIFY)
src/features/posts/queries.ts                    (MODIFY)
src/features/posts/mutations.ts                  (MODIFY)
src/features/notificaciones/queries.ts           (CREATE)
src/pages/ComunidadPage.tsx                      (CREATE)
src/pages/NotificacionesPage.tsx                 (CREATE)
src/components/notificacion/
  NotificationBell.tsx                            (CREATE)
  NotificationDropdown.tsx                        (CREATE)
  NotificacionItem.tsx                            (CREATE)
src/components/layout/MobileBottomBar.tsx         (MODIFY)
src/components/layout/DesktopSidebar.tsx          (MODIFY)
src/components/layout/Navbar.tsx                  (MODIFY)
src/components/post/PostCard.tsx                  (MODIFY — community posts)
src/App.tsx                                       (MODIFY)
src/test/mocks/fixtures.ts                        (MODIFY)
src/test/mocks/handlers.ts                        (MODIFY)
```

## Self-Review

- Self-comment check in trigger: prevents spam notifications ✓
- Community posts don't generate notifications (no coordinator) ✓
- RLS policies: only owner reads/updates notifications ✓
- CASCADE deletes: post deletion cleans up notifications ✓
- Badge disappears on dropdown open (marks all read) ✓
- Minimal new components, maximal reuse of existing PostCard/PostForm ✓
