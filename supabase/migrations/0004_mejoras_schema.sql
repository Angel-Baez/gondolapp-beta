-- Mejoras de schema tras revisión de arquitectura:
-- 1. estado_reposicion/estado_vencimiento pasan de enum nativo a
--    text + check constraint: más flexible para agregar valores a futuro
--    sin ALTER TYPE. Transparente para la app (Supabase ya serializaba
--    estos valores como string plano hacia TypeScript). Se hace primero
--    en el archivo para que el índice único parcial y las RPC de más
--    abajo ya trabajen sobre la columna final (evita reconstruir un
--    índice parcial en el medio de un ALTER COLUMN TYPE).
-- 2. Índice único parcial: un solo item "pendiente" por variante en
--    items_reposicion (antes solo lo garantizaba la app, con ventana de
--    carrera entre el SELECT y el INSERT/UPDATE).
-- 3. Trigger para items_reposicion.actualizado_at (nunca se actualizaba:
--    solo producto_bases tenía el trigger de updated_at).
-- 4. producto_variantes gana updated_at + trigger (nombre_completo/tipo/
--    sabor/tamano pueden cambiar y no quedaba registro de cuándo).
-- 5. Check constraint en items_vencimiento.cantidad (items_reposicion ya
--    lo tenía, esta tabla no).
-- 6. Trim automático en producto_bases.marca/categoria (evita duplicados
--    tipo "Lácteos " vs "Lácteos" en el autocompletado). Sin forzar mayúsculas/
--    minúsculas: castear con initcap() rompería marcas como "BabySec" o "iPhone".
-- 7. RPC functions atómicas para operaciones multi-paso (guardar lista,
--    retirar vencimiento, agregar item) que antes eran 4-6 round-trips
--    secuenciales sin transacción desde la app.

-- ============================================
-- 1. estado_reposicion / estado_vencimiento: enum -> text + check
-- ============================================

alter table items_reposicion alter column estado drop default;
alter table items_reposicion alter column estado type text using estado::text;
alter table items_reposicion alter column estado set default 'pendiente';
alter table items_reposicion
  add constraint items_reposicion_estado_check check (estado in ('pendiente', 'repuesto', 'sin_stock'));

alter table items_reposicion_historial alter column estado type text using estado::text;
alter table items_reposicion_historial
  add constraint items_reposicion_historial_estado_check check (estado in ('pendiente', 'repuesto', 'sin_stock'));

alter table items_vencimiento alter column estado drop default;
alter table items_vencimiento alter column estado type text using estado::text;
alter table items_vencimiento alter column estado set default 'pendiente';
alter table items_vencimiento
  add constraint items_vencimiento_estado_check check (estado in ('pendiente', 'retirado'));

drop type estado_reposicion;
drop type estado_vencimiento;

-- ============================================
-- 2. Índice único parcial: un pendiente por variante
-- ============================================

create unique index items_reposicion_pendiente_por_variante_uq
  on items_reposicion (variante_id)
  where estado = 'pendiente';

-- ============================================
-- 3. Trigger actualizado_at en items_reposicion
-- ============================================

create or replace function set_actualizado_at()
returns trigger as $$
begin
  new.actualizado_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trg_items_reposicion_actualizado_at
  before update on items_reposicion
  for each row
  execute function set_actualizado_at();

-- ============================================
-- 4. producto_variantes.updated_at
-- ============================================

alter table producto_variantes add column updated_at timestamptz not null default now();

create trigger trg_producto_variantes_updated_at
  before update on producto_variantes
  for each row
  execute function set_updated_at();

-- ============================================
-- 5. Check constraint en items_vencimiento.cantidad
-- ============================================

alter table items_vencimiento
  add constraint items_vencimiento_cantidad_check check (cantidad is null or cantidad > 0);

-- ============================================
-- 6. Trim automático en marca/categoria
-- ============================================

create or replace function normalizar_marca_categoria()
returns trigger as $$
begin
  new.marca = nullif(trim(new.marca), '');
  new.categoria = nullif(trim(new.categoria), '');
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trg_producto_bases_normalizar
  before insert or update on producto_bases
  for each row
  execute function normalizar_marca_categoria();

-- Backfill: aplicar el mismo trim a filas ya existentes.
update producto_bases
set marca = nullif(trim(marca), ''), categoria = nullif(trim(categoria), '')
where marca is distinct from nullif(trim(marca), '')
   or categoria is distinct from nullif(trim(categoria), '');

-- ============================================
-- 7. RPC functions atómicas
-- ============================================

-- Mismo cálculo que calcularNivelAlerta() en src/lib/utils.ts, para poder
-- snapshotear el nivel de alerta al momento de retirar un item (columna
-- nivel_alerta_al_retirar de items_vencimiento_historial).
create or replace function calcular_nivel_alerta(p_fecha_vencimiento date)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when (p_fecha_vencimiento - current_date) < 0 then 'vencido'
    when (p_fecha_vencimiento - current_date) <= 15 then 'critico'
    when (p_fecha_vencimiento - current_date) <= 30 then 'advertencia'
    when (p_fecha_vencimiento - current_date) <= 60 then 'precaucion'
    else 'normal'
  end;
$$;

-- Reemplaza select+insert/update en 2 round-trips por un upsert atómico
-- en 1, usando el índice único parcial de la sección 2.
create or replace function agregar_item_reposicion(p_variante_id uuid, p_cantidad int)
returns items_reposicion
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item items_reposicion%rowtype;
begin
  insert into items_reposicion (variante_id, cantidad, estado)
  values (p_variante_id, p_cantidad, 'pendiente')
  on conflict (variante_id) where estado = 'pendiente'
  do update set cantidad = items_reposicion.cantidad + excluded.cantidad
  returning * into v_item;

  return v_item;
end;
$$;

-- Reemplaza ~6 round-trips secuenciales sin transacción por una sola
-- llamada atómica.
create or replace function guardar_lista_reposicion()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lista_id uuid;
  v_fecha_creacion timestamptz;
  v_total_productos int;
  v_total_repuestos int;
  v_total_sin_stock int;
  v_total_pendientes int;
begin
  select
    count(*),
    count(*) filter (where estado = 'repuesto'),
    count(*) filter (where estado = 'sin_stock'),
    count(*) filter (where estado = 'pendiente'),
    min(agregado_at)
  into v_total_productos, v_total_repuestos, v_total_sin_stock, v_total_pendientes, v_fecha_creacion
  from items_reposicion;

  if v_total_productos = 0 then
    raise exception 'No hay items para guardar';
  end if;

  insert into listas_reposicion_historial (
    fecha_creacion, total_productos, total_repuestos, total_sin_stock, total_pendientes
  ) values (
    v_fecha_creacion, v_total_productos, v_total_repuestos, v_total_sin_stock, v_total_pendientes
  )
  returning id into v_lista_id;

  insert into items_reposicion_historial (
    lista_id, variante_id, producto_nombre, producto_marca, variante_nombre, cantidad, estado
  )
  select
    v_lista_id,
    ir.variante_id,
    coalesce(pb.nombre, 'Producto sin nombre'),
    pb.marca,
    coalesce(pv.nombre_completo, 'Variante sin nombre'),
    ir.cantidad,
    ir.estado
  from items_reposicion ir
  left join producto_variantes pv on pv.id = ir.variante_id
  left join producto_bases pb on pb.id = pv.producto_base_id;

  delete from items_reposicion;

  return v_lista_id;
end;
$$;

-- Reemplaza 4 round-trips secuenciales sin transacción por una sola
-- llamada atómica.
create or replace function retirar_item_vencimiento(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item items_vencimiento%rowtype;
  v_producto_nombre text := 'Producto sin nombre';
  v_producto_marca text := null;
  v_variante_nombre text := 'Variante sin nombre';
begin
  select * into v_item from items_vencimiento where id = p_item_id;
  if not found then
    raise exception 'Item de vencimiento % no encontrado', p_item_id;
  end if;

  select coalesce(pb.nombre, v_producto_nombre), pb.marca, coalesce(pv.nombre_completo, v_variante_nombre)
    into v_producto_nombre, v_producto_marca, v_variante_nombre
  from producto_variantes pv
  left join producto_bases pb on pb.id = pv.producto_base_id
  where pv.id = v_item.variante_id;

  insert into items_vencimiento_historial (
    variante_id, producto_nombre, producto_marca, variante_nombre, cantidad, lote,
    fecha_vencimiento, nivel_alerta_al_retirar
  ) values (
    v_item.variante_id, v_producto_nombre, v_producto_marca, v_variante_nombre, v_item.cantidad, v_item.lote,
    v_item.fecha_vencimiento, calcular_nivel_alerta(v_item.fecha_vencimiento)
  );

  delete from items_vencimiento where id = p_item_id;
end;
$$;
