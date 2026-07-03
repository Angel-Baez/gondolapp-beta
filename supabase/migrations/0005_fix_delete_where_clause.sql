-- Fix: este proyecto rechaza DELETE sin WHERE ("DELETE requires a WHERE
-- clause"), la misma restricción que ya forzaba al código viejo de la app
-- a usar `.not("id", "is", null)` en vez de un delete plano. Las funciones
-- guardar_lista_reposicion() y retirar_item_vencimiento() (migración 0004)
-- tenían un `delete from items_reposicion;` / `delete from items_vencimiento
-- where id = p_item_id` — la primera no tenía WHERE y fallaba; la segunda
-- ya tenía WHERE por id y esa nunca fue el problema. Se corrige agregando
-- `where id is not null` al delete masivo de guardar_lista_reposicion.

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

  delete from items_reposicion where id is not null;

  return v_lista_id;
end;
$$;
