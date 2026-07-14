-- Fase 2 multi-tienda (1/3): constraints e índices por tienda + triggers de
-- derivación incondicional de tienda_id (docs/SPECMULTIUSER.md §1.2, §1.3).
--
-- La derivación es INCONDICIONAL a propósito: ignora cualquier tienda_id
-- que envíe el cliente. El WITH CHECK de RLS valida membresía, no
-- consistencia — sin esto, un usuario miembro de dos tiendas podría crear
-- un item con tienda_id=B y variante de A. Como los triggers corren en el
-- contexto del invoker, el SELECT de derivación está sujeto a RLS: una
-- variante ajena devuelve NULL y el insert falla acá mismo.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Funciones de derivación
-- ─────────────────────────────────────────────────────────────────────────

-- producto_variantes ← producto_bases
create or replace function derivar_tienda_desde_base() returns trigger
language plpgsql set search_path = public as $$
begin
  select tienda_id into new.tienda_id
    from producto_bases where id = new.producto_base_id;
  if new.tienda_id is null then
    raise exception 'producto base inexistente o fuera de tus tiendas: %', new.producto_base_id;
  end if;
  return new;
end; $$;

-- items_reposicion / items_vencimiento / items_vencimiento_historial ← producto_variantes
create or replace function derivar_tienda_desde_variante() returns trigger
language plpgsql set search_path = public as $$
begin
  select tienda_id into new.tienda_id
    from producto_variantes where id = new.variante_id;
  if new.tienda_id is null then
    raise exception 'variante inexistente o fuera de tus tiendas: %', new.variante_id;
  end if;
  return new;
end; $$;

-- items_reposicion_historial ← listas_reposicion_historial
create or replace function derivar_tienda_desde_lista() returns trigger
language plpgsql set search_path = public as $$
begin
  select tienda_id into new.tienda_id
    from listas_reposicion_historial where id = new.lista_id;
  if new.tienda_id is null then
    raise exception 'lista inexistente o fuera de tus tiendas: %', new.lista_id;
  end if;
  return new;
end; $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Triggers BEFORE INSERT.
--    En producto_variantes conviven con trg_producto_variantes_nombre_completo
--    (BEFORE INSERT OR UPDATE): Postgres dispara triggers del mismo evento
--    en orden alfabético y "derivar" < "nombre", así que tienda_id ya está
--    seteado cuando set_nombre_completo() lo necesita (migración 0015).
-- ─────────────────────────────────────────────────────────────────────────

create trigger trg_producto_variantes_derivar_tienda
  before insert on producto_variantes
  for each row execute function derivar_tienda_desde_base();

create trigger trg_items_reposicion_derivar_tienda
  before insert on items_reposicion
  for each row execute function derivar_tienda_desde_variante();

create trigger trg_items_vencimiento_derivar_tienda
  before insert on items_vencimiento
  for each row execute function derivar_tienda_desde_variante();

create trigger trg_items_vencimiento_historial_derivar_tienda
  before insert on items_vencimiento_historial
  for each row execute function derivar_tienda_desde_variante();

create trigger trg_items_reposicion_historial_derivar_tienda
  before insert on items_reposicion_historial
  for each row execute function derivar_tienda_desde_lista();

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Unicidad por tienda (§1.3): el mismo EAN / la misma base / la misma
--    clave de atributo pueden existir en dos tiendas distintas.
--    El índice parcial items_reposicion_pendiente_por_variante_uq NO se
--    toca: una variante pertenece a una sola tienda, ya es único por
--    tienda, y es el target del ON CONFLICT de agregar_item_reposicion.
-- ─────────────────────────────────────────────────────────────────────────

alter table producto_variantes drop constraint producto_variantes_codigo_barras_key;
create unique index producto_variantes_tienda_codigo_uq
  on producto_variantes (tienda_id, codigo_barras);

drop index producto_bases_nombre_marca_uq;
create unique index producto_bases_nombre_marca_uq
  on producto_bases (tienda_id, lower(trim(nombre)), lower(trim(coalesce(marca, ''))));

drop index categoria_atributos_categoria_clave_uq;
create unique index categoria_atributos_categoria_clave_uq
  on categoria_atributos (tienda_id, coalesce(categoria, ''), clave);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Índices compuestos de hot paths (las policies filtran por tienda_id
--    y las queries de listas por estado/fecha).
-- ─────────────────────────────────────────────────────────────────────────

create index idx_items_reposicion_tienda_estado
  on items_reposicion (tienda_id, estado);
create index idx_items_vencimiento_tienda_estado_fecha
  on items_vencimiento (tienda_id, estado, fecha_vencimiento);
create index idx_listas_reposicion_historial_tienda_fecha
  on listas_reposicion_historial (tienda_id, fecha_guardado desc);
create index idx_items_vencimiento_historial_tienda_fecha
  on items_vencimiento_historial (tienda_id, fecha_retiro desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Fin de la ventana de transición de la Fase 1: los DEFAULT ya no hacen
--    falta (los triggers derivan; producto_bases y categoria_atributos
--    reciben tienda_id explícito del route/RPC).
-- ─────────────────────────────────────────────────────────────────────────

alter table producto_bases alter column tienda_id drop default;
alter table producto_variantes alter column tienda_id drop default;
alter table categoria_atributos alter column tienda_id drop default;
alter table items_reposicion alter column tienda_id drop default;
alter table listas_reposicion_historial alter column tienda_id drop default;
alter table items_reposicion_historial alter column tienda_id drop default;
alter table items_vencimiento alter column tienda_id drop default;
alter table items_vencimiento_historial alter column tienda_id drop default;
