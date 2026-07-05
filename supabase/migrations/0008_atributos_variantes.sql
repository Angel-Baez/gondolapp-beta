-- Atributos flexibles por variante: los ejes de variación (tipo, sabor,
-- tamano, y los que traiga cada categoría nueva) pasan de columnas fijas a
-- un jsonb clave->valor en producto_variantes. Se elige jsonb por sobre EAV
-- porque los caminos calientes de la app leen variante+base en un solo
-- embed de PostgREST y el cliente persiste en IndexedDB via JSON.stringify:
-- un objeto plano viaja en la misma fila sin joins ni re-ensamblaje.
--
-- categoria_atributos NO es EAV: los valores viven en el jsonb de la
-- variante; esta tabla solo define qué claves mostrar por categoría, con
-- qué etiqueta, en qué orden (formulario dinámico + armado de
-- nombre_completo) y qué valores sugerir. categoria null = default global;
-- una categoría con >=1 fila REEMPLAZA al default. Claves que no figuran
-- en la definición van al final del nombre, en orden alfabético.
--
-- nombre_completo pasa a tener un solo dueño: el trigger de esta migración.
-- Se recomputa en cada insert/update de la variante y al renombrar la base,
-- así cualquier write path (API, import masivo, fix por SQL) lo deja
-- consistente. La búsqueda ilike sobre nombre_completo depende de esto.
--
-- Las columnas legacy tipo/sabor/tamano NO se dropean acá: eso va en 0009,
-- que debe aplicarse después del deploy del código que escribe atributos
-- (los clientes viejos siguen insertando en las columnas legacy durante la
-- ventana entre esta migración y el deploy).

-- ============================================
-- 1. Columna de atributos
-- ============================================

alter table producto_variantes
  add column atributos jsonb not null default '{}'::jsonb;

alter table producto_variantes
  add constraint producto_variantes_atributos_es_objeto
  check (jsonb_typeof(atributos) = 'object');

-- ============================================
-- 2. Backfill desde las columnas legacy
-- ============================================

update producto_variantes
set atributos = jsonb_strip_nulls(jsonb_build_object(
  'tipo',   nullif(trim(tipo), ''),
  'sabor',  nullif(trim(sabor), ''),
  'tamano', nullif(trim(tamano), '')
))
where coalesce(nullif(trim(tipo), ''), nullif(trim(sabor), ''),
               nullif(trim(tamano), '')) is not null;

-- ============================================
-- 3. Índice GIN para filtros por contención (@>)
-- ============================================

create index idx_producto_variantes_atributos
  on producto_variantes using gin (atributos jsonb_path_ops);

-- ============================================
-- 4. Definiciones de atributos por categoría
-- ============================================

create table categoria_atributos (
  id uuid primary key default gen_random_uuid(),
  categoria text,
  clave text not null,
  etiqueta text not null,
  orden int not null default 0,
  sugerencias text[] not null default '{}',
  created_at timestamptz not null default now()
);

create unique index categoria_atributos_categoria_clave_uq
  on categoria_atributos (coalesce(categoria, ''), clave);

alter table categoria_atributos enable row level security;
create policy "allow_all_anon" on categoria_atributos
  for all to anon, authenticated using (true) with check (true);

-- Seed del default global: mismas claves y orden que el armado actual.
insert into categoria_atributos (categoria, clave, etiqueta, orden) values
  (null, 'tipo',   'Tipo',   0),
  (null, 'sabor',  'Sabor',  1),
  (null, 'tamano', 'Tamaño', 2);

-- ============================================
-- 5. nombre_completo: campo derivado con dueño único
-- ============================================

create or replace function armar_nombre_completo(
  p_nombre_base text,
  p_categoria text,
  p_atributos jsonb
)
returns text
language sql
stable
set search_path = public
as $$
  with defs as (
    -- Definiciones de la categoría si tiene alguna; si no, las globales.
    select clave, orden from categoria_atributos where categoria = p_categoria
    union all
    select clave, orden from categoria_atributos
    where categoria is null
      and not exists (
        select 1 from categoria_atributos where categoria = p_categoria
      )
  )
  select trim(concat_ws(' ',
    p_nombre_base,
    -- El guard de tipo evita que jsonb_each_text explote si llega un
    -- no-objeto: el trigger BEFORE corre antes que el CHECK constraint,
    -- y el rechazo claro debe darlo el CHECK, no esta función.
    case when jsonb_typeof(p_atributos) = 'object' then (
      select string_agg(a.valor, ' ' order by coalesce(d.orden, 999), a.clave)
      from jsonb_each_text(p_atributos) as a(clave, valor)
      left join defs d on d.clave = a.clave
      where nullif(trim(a.valor), '') is not null
    ) end
  ))
$$;

-- Incondicional en UPDATE (no "update of atributos"): así ni un update
-- manual de nombre_completo por SQL puede dejarlo desincronizado — siempre
-- se deriva. En INSERT hay una excepción de compatibilidad para la ventana
-- 0008→deploy: los clientes viejos mandan el nombre ya armado y dejan
-- atributos vacío; se respeta su valor hasta que el re-backfill de 0009
-- llene atributos (ese update dispara el recompute).
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
  new.nombre_completo = armar_nombre_completo(v_nombre, v_categoria, new.atributos);
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trg_producto_variantes_nombre_completo
  before insert or update on producto_variantes
  for each row
  execute function set_nombre_completo();

-- Renombrar la base (o cambiarle la categoría, que cambia el orden de las
-- claves) propaga a los nombres de sus variantes. El SET de nombre_completo
-- es solo para disparar el trigger BEFORE UPDATE, que es quien recomputa.
create or replace function propagar_nombre_base()
returns trigger as $$
begin
  update producto_variantes
  set nombre_completo = nombre_completo
  where producto_base_id = new.id;
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trg_producto_bases_propagar_nombre
  after update on producto_bases
  for each row
  when (old.nombre is distinct from new.nombre
        or old.categoria is distinct from new.categoria)
  execute function propagar_nombre_base();

-- ============================================
-- 6. Recompute inicial: deja el stock existente consistente
-- ============================================

-- El SET dispara el trigger BEFORE UPDATE, que recomputa desde atributos.
-- Puede alterar nombres legacy cuyo orden difiera del canónico (tipo,
-- sabor, tamano); verificar el diff en local antes de aplicar en prod.
update producto_variantes set nombre_completo = nombre_completo;
