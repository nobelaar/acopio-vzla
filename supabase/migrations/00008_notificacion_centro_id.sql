-- Add centro_id to notifications for correct navigation
alter table public.notificacion
  add column if not exists centro_id uuid references public.centros_acopio(id) on delete set null;

-- Update trigger to store centro_id
create or replace function public.notificar_comentario()
returns trigger as $$
declare
  v_coordinador_id uuid;
  v_centro_id uuid;
begin
  select p.centro_id, c.coordinador_id into v_centro_id, v_coordinador_id
  from public.posts p
  left join public.centros_acopio c on c.id = p.centro_id
  where p.id = new.post_id;

  if v_coordinador_id is not null and v_coordinador_id != new.user_id then
    insert into public.notificacion (user_id, post_id, centro_id, tipo)
    values (v_coordinador_id, new.post_id, v_centro_id, 'comentario');
  end if;

  return new;
end;
$$ language plpgsql security definer;
