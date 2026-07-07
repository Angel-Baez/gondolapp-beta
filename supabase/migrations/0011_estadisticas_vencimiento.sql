-- obtener_estadisticas_vencimiento: agrega las estadísticas de retiros en
-- Postgres en vez del cliente.
--
-- Antes obtenerEstadisticas() bajaba todo el historial del período y agregaba
-- en JS: lento para "año" y silenciosamente incorrecto pasadas las 1000 filas
-- (cap implícito de PostgREST). Además el total contaba filas mientras el top
-- de productos sumaba cantidades — acá ambos cuentan unidades (cantidad, o 1
-- si no se registró).

create or replace function obtener_estadisticas_vencimiento(
  p_desde timestamptz,
  p_hasta timestamptz
)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with retirados as (
    select
      producto_nombre,
      coalesce(cantidad, 1) as unidades,
      (fecha_retiro::date - fecha_vencimiento) as dias_a_retiro
    from items_vencimiento_historial
    where fecha_retiro >= p_desde
      and fecha_retiro <= p_hasta
  )
  select json_build_object(
    'total_retirados', coalesce((select sum(unidades) from retirados), 0)::int,
    'promedio_dias_a_retiro', coalesce((select avg(dias_a_retiro) from retirados), 0),
    'productos_mas_retirados', coalesce(
      (
        select json_agg(t)
        from (
          select producto_nombre, sum(unidades)::int as cantidad
          from retirados
          group by producto_nombre
          order by cantidad desc
          limit 10
        ) t
      ),
      '[]'::json
    )
  );
$$;
