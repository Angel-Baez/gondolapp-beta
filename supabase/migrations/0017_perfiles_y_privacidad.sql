-- Fase 3.1: perfiles con nombre, privacidad de la lista de reposición y
-- hardening de equipo. Responde a los hallazgos del testing real de la
-- Fase 3:
--
-- 1. Cada usuario tiene un nombre visible (tabla perfiles) para atribuir
--    listas e items ("quién agregó/guardó esto").
-- 2. La lista de reposición ACTIVA pasa a ser privada por usuario
--    (agregado_por + RLS): nadie ve los items pendientes de otro hasta
--    que se guardan — el historial sigue siendo compartido de la tienda.
-- 3. El equipo deja de ser enumerable por empleados: tienda_miembros solo
--    muestra la fila propia (o todas si sos admin) y miembros_de_tienda
--    pasa a ser admin-only.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Perfiles
-- ─────────────────────────────────────────────────────────────────────────

create table perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (length(trim(nombre)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_perfiles_updated_at
  before update on perfiles
  for each row execute function set_updated_at();

alter table perfiles enable row level security;

-- Compañeros de cualquier tienda compartida. DEFINER: la policy de
-- perfiles no puede subconsultar tienda_miembros como invoker porque su
-- select ahora es propio-o-admin (un empleado no vería a sus compañeros).
create or replace function mis_companeros() returns setof uuid
language sql stable security definer set search_path = public as
$$
  select distinct tm.user_id from tienda_miembros tm
  where tm.tienda_id in (
    select tienda_id from tienda_miembros where user_id = (select auth.uid())
  )
$$;

revoke execute on function mis_companeros() from public, anon;
grant execute on function mis_companeros() to authenticated, service_role;

-- El nombre es visible entre compañeros de tienda (atribución de items);
-- el email NO viaja por acá (eso queda en miembros_de_tienda, admin-only).
create policy "perfiles_select_companeros" on perfiles
  for select to authenticated
  using (user_id in (select mis_companeros()) or user_id = (select auth.uid()));
create policy "perfiles_insert_propio" on perfiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "perfiles_update_propio" on perfiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Backfill de los usuarios existentes: metadata del signup o local-part
-- del email.
insert into perfiles (user_id, nombre)
select
  id,
  coalesce(
    nullif(trim(raw_user_meta_data->>'nombre'), ''),
    nullif(split_part(email, '@', 1), ''),
    'Usuario'
  )
from auth.users
on conflict (user_id) do nothing;

-- Alta automática para los usuarios futuros (patrón handle_new_user).
create or replace function crear_perfil_de_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (user_id, nombre)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nombre'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Usuario'
    )
  )
  on conflict (user_id) do nothing;
  return new;
end; $$;

create trigger trg_crear_perfil_de_usuario
  after insert on auth.users
  for each row execute function crear_perfil_de_usuario();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Atribución: agregado_por / guardada_por
--    Referencian perfiles (no auth.users) para que PostgREST pueda embeber
--    el nombre en un solo select. Backfill: el admin más antiguo de la
--    tienda (único autor posible de lo pre-existente).
-- ─────────────────────────────────────────────────────────────────────────

alter table items_reposicion
  add column agregado_por uuid references perfiles(user_id) on delete cascade
  default auth.uid();

update items_reposicion ir set agregado_por = (
  select tm.user_id from tienda_miembros tm
  where tm.tienda_id = ir.tienda_id and tm.rol = 'admin'
  order by tm.created_at limit 1
) where agregado_por is null;

alter table items_reposicion alter column agregado_por set not null;
create index idx_items_reposicion_agregado_por on items_reposicion (agregado_por);

alter table items_vencimiento
  add column agregado_por uuid references perfiles(user_id) on delete set null
  default auth.uid();

update items_vencimiento iv set agregado_por = (
  select tm.user_id from tienda_miembros tm
  where tm.tienda_id = iv.tienda_id and tm.rol = 'admin'
  order by tm.created_at limit 1
) where agregado_por is null;

alter table listas_reposicion_historial
  add column guardada_por uuid references perfiles(user_id) on delete set null
  default auth.uid();

update listas_reposicion_historial lr set guardada_por = (
  select tm.user_id from tienda_miembros tm
  where tm.tienda_id = lr.tienda_id and tm.rol = 'admin'
  order by tm.created_at limit 1
) where guardada_por is null;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. La lista activa de reposición es privada por usuario. El WITH CHECK
--    con auth.uid() impide insertar a nombre de otro; la membresía sigue
--    exigida (un expulsado pierde acceso aunque los items sean suyos).
-- ─────────────────────────────────────────────────────────────────────────

drop policy "items_reposicion_select_miembros" on items_reposicion;
drop policy "items_reposicion_insert_miembros" on items_reposicion;
drop policy "items_reposicion_update_miembros" on items_reposicion;
drop policy "items_reposicion_delete_miembros" on items_reposicion;

create policy "items_reposicion_select_propio" on items_reposicion
  for select to authenticated
  using (agregado_por = (select auth.uid()) and tienda_id in (select mis_tiendas()));
create policy "items_reposicion_insert_propio" on items_reposicion
  for insert to authenticated
  with check (agregado_por = (select auth.uid()) and tienda_id in (select mis_tiendas()));
create policy "items_reposicion_update_propio" on items_reposicion
  for update to authenticated
  using (agregado_por = (select auth.uid()) and tienda_id in (select mis_tiendas()))
  with check (agregado_por = (select auth.uid()) and tienda_id in (select mis_tiendas()));
create policy "items_reposicion_delete_propio" on items_reposicion
  for delete to authenticated
  using (agregado_por = (select auth.uid()) and tienda_id in (select mis_tiendas()));

-- Con listas privadas, dos usuarios pueden tener la misma variante
-- pendiente a la vez: la unicidad pasa a (usuario, variante).
drop index items_reposicion_pendiente_por_variante_uq;
create unique index items_reposicion_pendiente_por_usuario_uq
  on items_reposicion (agregado_por, variante_id) where estado = 'pendiente';

-- Mismo cuerpo que 0015; solo cambia el target del ON CONFLICT al índice
-- nuevo (agregado_por sale del DEFAULT auth.uid()). El UPDATE del merge ya
-- queda scopeado a los items propios vía RLS (invoker).
create or replace function agregar_item_reposicion(p_variante_id uuid, p_cantidad int)
returns items_reposicion
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item items_reposicion%rowtype;
begin
  update items_reposicion
  set cantidad = cantidad + p_cantidad,
      estado = 'pendiente'
  where id = (
    select id
    from items_reposicion
    where variante_id = p_variante_id
    order by (estado = 'pendiente') desc, agregado_at desc
    limit 1
  )
  returning * into v_item;

  if found then
    return v_item;
  end if;

  insert into items_reposicion (variante_id, cantidad, estado)
  values (p_variante_id, p_cantidad, 'pendiente')
  on conflict (agregado_por, variante_id) where estado = 'pendiente'
  do update set cantidad = items_reposicion.cantidad + excluded.cantidad
  returning * into v_item;

  return v_item;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Equipo: los empleados no enumeran miembros; la lista con emails es
--    exclusiva de admins (la UI de /tienda pasa a ser admin-only).
-- ─────────────────────────────────────────────────────────────────────────

drop policy "tienda_miembros_select_miembros" on tienda_miembros;
create policy "tienda_miembros_select_propio_o_admin" on tienda_miembros
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or tienda_id in (select mis_tiendas_admin())
  );

drop function miembros_de_tienda(uuid);
create function miembros_de_tienda(p_tienda_id uuid)
returns table (user_id uuid, email text, nombre text, rol text, creado_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select tm.user_id, u.email::text, coalesce(p.nombre, split_part(u.email, '@', 1)), tm.rol, tm.created_at
  from tienda_miembros tm
  join auth.users u on u.id = tm.user_id
  left join perfiles p on p.user_id = tm.user_id
  where tm.tienda_id = p_tienda_id
    and p_tienda_id in (
      select tienda_id from tienda_miembros
      where tienda_miembros.user_id = (select auth.uid())
        and tienda_miembros.rol = 'admin'
    )
  order by tm.created_at;
$$;

revoke execute on function miembros_de_tienda(uuid) from public, anon;
grant execute on function miembros_de_tienda(uuid) to authenticated, service_role;
