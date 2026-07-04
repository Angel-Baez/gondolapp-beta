-- retirar_items_vencimiento: versión set-based (masiva) de
-- retirar_item_vencimiento (migración 0004).
--
-- La acción masiva del modo selección disparaba una RPC por item
-- (Promise.all desde la app): N round-trips y sin atomicidad entre ellos —
-- un fallo a mitad de lote dejaba algunos items retirados y otros no.
-- Esta función snapshotea al historial y borra todo el lote en una sola
-- transacción.

create or replace function retirar_items_vencimiento(p_item_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into items_vencimiento_historial (
    variante_id, producto_nombre, producto_marca, variante_nombre, cantidad, lote,
    fecha_vencimiento, nivel_alerta_al_retirar
  )
  select
    iv.variante_id,
    coalesce(pb.nombre, 'Producto sin nombre'),
    pb.marca,
    coalesce(pv.nombre_completo, 'Variante sin nombre'),
    iv.cantidad,
    iv.lote,
    iv.fecha_vencimiento,
    calcular_nivel_alerta(iv.fecha_vencimiento)
  from items_vencimiento iv
  left join producto_variantes pv on pv.id = iv.variante_id
  left join producto_bases pb on pb.id = pv.producto_base_id
  where iv.id = any(p_item_ids);

  -- El proyecto rechaza DELETE sin WHERE (ver migración 0005); acá el
  -- WHERE por ids ya lo cumple.
  delete from items_vencimiento where id = any(p_item_ids);
end;
$$;
