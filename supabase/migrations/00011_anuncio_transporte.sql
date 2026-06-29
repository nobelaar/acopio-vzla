-- 00011_anuncio_transporte.sql
-- Agrega soporte para anuncios de tipo 'transporte'

-- 1. Modificar el check constraint de tipo para aceptar 'transporte'
alter table public.anuncio
  drop constraint if exists anuncio_tipo_check;

alter table public.anuncio
  add constraint anuncio_tipo_check
    check (tipo in ('hospedaje', 'transporte'));

-- 2. Agregar columnas nuevas (todas opcionales)
alter table public.anuncio
  add column if not exists destino       text,
  add column if not exists tipo_carga    text check (tipo_carga    in ('personas', 'insumos', 'ambos')),
  add column if not exists tipo_vehiculo text check (tipo_vehiculo in ('carro', 'camioneta', 'camion', 'moto'));

-- 3. Indices opcionales
create index if not exists idx_anuncio_destino     on public.anuncio (destino);
create index if not exists idx_anuncio_tipo_carga   on public.anuncio (tipo_carga);
