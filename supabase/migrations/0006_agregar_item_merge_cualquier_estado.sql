-- agregar_item_reposicion: merge con cualquier estado, no solo pendiente.
--
-- La versión de la migración 0004 solo mergeaba vía ON CONFLICT contra el
-- índice único parcial (estado = 'pendiente'). Pero la semántica de la app
-- (services/reposicion.ts y el merge offline de useReposicion) es otra:
-- re-escanear una variante que ya está repuesta/sin_stock la REABRE a
-- pendiente sumando cantidad, sin crear una fila duplicada. Con la RPC
-- vieja, ese caso insertaba una segunda fila pendiente y dejaba la
-- repuesta huérfana.
--
-- Esta versión primero intenta el merge contra la fila existente de la
-- variante (prefiriendo una pendiente si la hubiera, para no chocar con el
-- índice único parcial), y solo si no hay ninguna inserta — con el mismo
-- ON CONFLICT de siempre como red ante dos escaneos concurrentes.

create or replace function agregar_item_reposicion(p_variante_id uuid, p_cantidad int)
returns items_reposicion
language plpgsql
security definer
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
  on conflict (variante_id) where estado = 'pendiente'
  do update set cantidad = items_reposicion.cantidad + excluded.cantidad
  returning * into v_item;

  return v_item;
end;
$$;
