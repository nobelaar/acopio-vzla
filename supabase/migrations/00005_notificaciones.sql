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
