-- Fase 2 multi-tienda (3/3): las 5 RPCs pasan a SECURITY INVOKER (RLS como
-- único punto de enforcement) y llegan las RPCs de tiendas/invitaciones
-- (docs/SPECMULTIUSER.md §1.5). Regla para las DEFINER nuevas: cada guard
-- que la policy ya no aplica va escrito DENTRO de la función, y cada una
-- lleva su revoke a public/anon en esta misma migración.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. agregar_item_reposicion → invoker. Firma y cuerpo sin cambios: como
--    invoker, una variante ajena es invisible para el SELECT/UPDATE y el
--    trigger de derivación (0013) completa tienda_id en el INSERT, validado
--    por el WITH CHECK. El ON CONFLICT sigue apuntando al índice parcial.
-- ─────────────────────────────────────────────────────────────────────────

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
  on conflict (variante_id) where estado = 'pendiente'
  do update set cantidad = items_reposicion.cantidad + excluded.cantidad
  returning * into v_item;

  return v_item;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. guardar_lista_reposicion gana p_tienda_id (la tienda activa viene del
--    cliente). El WHERE por tienda es IMPRESCINDIBLE, no redundante: como
--    invoker, RLS filtra por TODAS las tiendas del usuario — sin el WHERE,
--    un usuario con dos membresías que guarda la lista de A archivaría y
--    vaciaría también los items pendientes de B.
-- ─────────────────────────────────────────────────────────────────────────

drop function guardar_lista_reposicion();

create function guardar_lista_reposicion(p_tienda_id uuid)
returns uuid
language plpgsql
security invoker
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
  if p_tienda_id not in (select mis_tiendas()) then
    raise exception 'No sos miembro de esta tienda';
  end if;

  select
    count(*),
    count(*) filter (where estado = 'repuesto'),
    count(*) filter (where estado = 'sin_stock'),
    count(*) filter (where estado = 'pendiente'),
    min(agregado_at)
  into v_total_productos, v_total_repuestos, v_total_sin_stock, v_total_pendientes, v_fecha_creacion
  from items_reposicion
  where tienda_id = p_tienda_id;

  if v_total_productos = 0 then
    raise exception 'No hay items para guardar';
  end if;

  insert into listas_reposicion_historial (
    tienda_id, fecha_creacion, total_productos, total_repuestos, total_sin_stock, total_pendientes
  ) values (
    p_tienda_id, v_fecha_creacion, v_total_productos, v_total_repuestos, v_total_sin_stock, v_total_pendientes
  )
  returning id into v_lista_id;

  -- tienda_id del historial de items lo deriva el trigger desde lista_id.
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
  left join producto_bases pb on pb.id = pv.producto_base_id
  where ir.tienda_id = p_tienda_id;

  -- Mantiene la regla "DELETE con WHERE" (migración 0005), ahora por tienda.
  delete from items_reposicion where tienda_id = p_tienda_id;

  return v_lista_id;
end;
$$;

revoke execute on function guardar_lista_reposicion(uuid) from public, anon;
grant execute on function guardar_lista_reposicion(uuid) to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. retirar_item_vencimiento / retirar_items_vencimiento → invoker.
--    Firmas y cuerpos sin cambios: con RLS, los ids ajenos "no existen"
--    (la individual falla con 'no encontrado'; la masiva simplemente no
--    los matchea). El historial deriva tienda_id por trigger.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function retirar_item_vencimiento(p_item_id uuid)
returns void
language plpgsql
security invoker
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

create or replace function retirar_items_vencimiento(p_item_ids uuid[])
returns void
language plpgsql
security invoker
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

-- ─────────────────────────────────────────────────────────────────────────
-- 4. obtener_estadisticas_vencimiento gana p_tienda_id → invoker.
--    Sin el filtro, un usuario multi-tienda vería agregados mezclados; sin
--    invoker, CUALQUIER usuario veía los de todas las tiendas (hallazgo C1
--    del análisis). Un no-miembro obtiene stats vacías (RLS filtra todo).
-- ─────────────────────────────────────────────────────────────────────────

drop function obtener_estadisticas_vencimiento(timestamptz, timestamptz);

create function obtener_estadisticas_vencimiento(
  p_tienda_id uuid,
  p_desde timestamptz,
  p_hasta timestamptz
)
returns json
language sql
stable
security invoker
set search_path = public
as $$
  with retirados as (
    select
      producto_nombre,
      coalesce(cantidad, 1) as unidades,
      (fecha_retiro::date - fecha_vencimiento) as dias_a_retiro
    from items_vencimiento_historial
    where tienda_id = p_tienda_id
      and fecha_retiro >= p_desde
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

revoke execute on function obtener_estadisticas_vencimiento(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function obtener_estadisticas_vencimiento(uuid, timestamptz, timestamptz) to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. armar_nombre_completo gana p_tienda_id: sin el filtro, los nombres
--    derivados mezclarían definiciones de atributos de otras tiendas.
--    set_nombre_completo() le pasa new.tienda_id (ya seteado por el trigger
--    de derivación de la 0013, que dispara antes por orden alfabético).
-- ─────────────────────────────────────────────────────────────────────────

drop function armar_nombre_completo(text, text, jsonb);

create function armar_nombre_completo(
  p_tienda_id uuid,
  p_nombre_base text,
  p_categoria text,
  p_atributos jsonb
)
returns text
language sql
stable
security invoker
set search_path = public
as $$
  with defs as (
    select clave, orden from categoria_atributos
    where tienda_id = p_tienda_id and categoria = p_categoria
    union all
    select clave, orden from categoria_atributos
    where tienda_id = p_tienda_id
      and categoria is null
      and not exists (
        select 1 from categoria_atributos
        where tienda_id = p_tienda_id and categoria = p_categoria
      )
  )
  select trim(concat_ws(' ',
    p_nombre_base,
    case when jsonb_typeof(p_atributos) = 'object' then (
      select string_agg(a.valor, ' ' order by coalesce(d.orden, 999), a.clave)
      from jsonb_each_text(p_atributos) as a(clave, valor)
      left join defs d on d.clave = a.clave
      where nullif(trim(a.valor), '') is not null
    ) end
  ))
$$;

create or replace function set_nombre_completo()
returns trigger as $$
declare
  v_nombre text;
  v_categoria text;
begin
  if tg_op = 'INSERT'
     and new.atributos = '{}'::jsonb
     and new.nombre_completo is not null then
    return new;
  end if;
  select nombre, categoria into v_nombre, v_categoria
  from producto_bases where id = new.producto_base_id;
  new.nombre_completo = armar_nombre_completo(new.tienda_id, v_nombre, v_categoria, new.atributos);
  return new;
end;
$$ language plpgsql set search_path = public;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. RPCs de tiendas e invitaciones (SECURITY DEFINER: resuelven el
--    huevo-y-gallina de RLS — sin membresía no podés insertar membresías).
-- ─────────────────────────────────────────────────────────────────────────

create function crear_tienda_con_admin(p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_tienda_id uuid;
begin
  if v_uid is null then
    raise exception 'Requiere sesión';
  end if;

  insert into tiendas (nombre, created_by) values (p_nombre, v_uid)
  returning id into v_tienda_id;

  insert into tienda_miembros (tienda_id, user_id, rol)
  values (v_tienda_id, v_uid, 'admin');

  -- Seed de definiciones default, como el de la migración 0008.
  insert into categoria_atributos (tienda_id, categoria, clave, etiqueta, orden) values
    (v_tienda_id, null, 'tipo',   'Tipo',   0),
    (v_tienda_id, null, 'sabor',  'Sabor',  1),
    (v_tienda_id, null, 'tamano', 'Tamaño', 2);

  return v_tienda_id;
end;
$$;

-- Canje ATÓMICO (sin race check-then-increment: el UPDATE toma el row lock
-- y el segundo canje concurrente ya no matchea usos < max_usos). Un
-- re-canje de alguien que ya es miembro no quema usos.
create function canjear_invitacion(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_tienda_id uuid;
  v_rol text;
begin
  if v_uid is null then
    raise exception 'Requiere sesión';
  end if;

  select tienda_id into v_tienda_id from tienda_invitaciones where codigo = p_codigo;
  if v_tienda_id is not null and exists (
    select 1 from tienda_miembros
    where tienda_id = v_tienda_id and user_id = v_uid
  ) then
    return v_tienda_id;
  end if;

  update tienda_invitaciones
     set usos = usos + 1
   where codigo = p_codigo
     and not revocada
     and expira_at > now()
     and usos < max_usos
  returning tienda_id, rol into v_tienda_id, v_rol;

  if v_tienda_id is null then
    raise exception 'Código inválido, vencido o agotado';
  end if;

  insert into tienda_miembros (tienda_id, user_id, rol)
  values (v_tienda_id, v_uid, v_rol)
  on conflict do nothing;

  return v_tienda_id;
end;
$$;

-- Guard admin en la primera línea: como DEFINER bypasea la policy de
-- insert de tienda_invitaciones — sin este check, cualquier autenticado
-- emitiría invitaciones (incluso de admin) de cualquier tienda.
create function generar_codigo_invitacion(
  p_tienda_id uuid,
  p_rol text default 'empleado',
  p_max_usos int default 1,
  p_dias int default 7
)
returns text
language plpgsql
security definer
-- extensions en el search_path: gen_random_bytes (pgcrypto) vive en el
-- schema extensions en Supabase; un schema inexistente se ignora, así que
-- también funciona donde pgcrypto quedó en public.
set search_path = public, extensions
as $$
declare
  -- Sin caracteres ambiguos (0/O, 1/I/L): el caso de uso es dictarlo en voz
  -- alta en el pasillo.
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_codigo text;
begin
  if p_tienda_id not in (select mis_tiendas_admin()) then
    raise exception 'Solo un admin de la tienda puede generar invitaciones';
  end if;
  if p_rol not in ('admin', 'empleado') then
    raise exception 'Rol inválido: %', p_rol;
  end if;
  if p_max_usos < 1 or p_dias < 1 then
    raise exception 'max_usos y dias deben ser positivos';
  end if;

  loop
    select string_agg(
      substr(v_alfabeto, (get_byte(gen_random_bytes(1), 0) % length(v_alfabeto)) + 1, 1),
      ''
    )
    from generate_series(1, 8)
    into v_codigo;

    begin
      insert into tienda_invitaciones (tienda_id, codigo, rol, creado_por, expira_at, max_usos)
      values (p_tienda_id, v_codigo, p_rol, auth.uid(), now() + make_interval(days => p_dias), p_max_usos);
      return v_codigo;
    exception when unique_violation then
      -- Colisión de código (improbable con 31^8): reintentar.
    end;
  end loop;
end;
$$;

revoke execute on function crear_tienda_con_admin(text) from public, anon;
revoke execute on function canjear_invitacion(text) from public, anon;
revoke execute on function generar_codigo_invitacion(uuid, text, int, int) from public, anon;
grant execute on function crear_tienda_con_admin(text) to authenticated, service_role;
grant execute on function canjear_invitacion(text) to authenticated, service_role;
grant execute on function generar_codigo_invitacion(uuid, text, int, int) to authenticated, service_role;
