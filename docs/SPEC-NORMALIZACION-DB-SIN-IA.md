# 🧹 Spec: Normalización de catálogo en la capa de DB — SIN IA en la DB

> **Estado**: Propuesta para revisión. No implementado.
> **Fecha**: julio 2026.
> **Verificada contra**: main `2d6adaf` (2026-07-14). Cada cita `archivo:línea` fue contrastada contra ese árbol. **Regla operativa** (heredada de `SPECMULTIUSER.md`): re-verificar el inventario de "Estado actual" antes de arrancar cada fase.
> **Documento hermano**: [`SPEC-NORMALIZACION-DB-CON-IA.md`](./SPEC-NORMALIZACION-DB-CON-IA.md). Ambas specs comparten el **núcleo determinístico** (§4.1–§4.3 son idénticos); difieren en dónde vive el parseo con LLM: acá queda en la capa de aplicación, allá se invoca desde Postgres con pg_net.
> **Decisiones base**: toda la normalización determinística en DB · el parseo LLM (`/api/productos/parsear`) queda en la app tal como está · la DB es la autoridad de la forma canónica en el write.

## Índice

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Estado actual](#estado-actual)
3. [Evaluación de alternativas](#evaluación-de-alternativas)
4. [Diseño técnico](#diseño-técnico)
5. [Plan de migraciones](#plan-de-migraciones)
6. [Plan de testing](#plan-de-testing)
7. [Rollout / Rollback](#rollout--rollback)
8. [Riesgos](#riesgos)
9. [Preguntas abiertas](#preguntas-abiertas)

---

## Resumen ejecutivo

Hoy la normalización del catálogo está repartida en tres capas: un trigger de Postgres que solo trimea `producto_bases`, funciones TypeScript en la route y el servicio de catálogo, y el prompt del parseo con IA. Esta spec mueve **toda la normalización determinística a la base de datos** — triggers y funciones SQL son la única autoridad de la forma canónica — y deja el parseo LLM donde está (capa app), redefiniendo su contrato: **la salida del LLM es una propuesta; la DB decide la forma final en el write**.

Qué se mueve a DB:

- Saneo y canonicalización de atributos de variante (hoy `canonicalizarAtributos` en la route + `sanitizarAtributos` en el servicio) → trigger + función SQL.
- Canonicalización de marca/categoría contra los valores existentes de la tienda ("MILEX" reutiliza "Milex") → extensión del trigger existente de bases.
- El alta atómica base+variante con dup-check de EAN y reutilización de base → RPC transaccional `crear_producto_manual`.
- El preview de la pantalla de confirmación → RPC read-only `previsualizar_normalizacion` que ejecuta exactamente el mismo código que el write.

Qué NO se mueve: el parseo LLM (`parsearProducto`, Anthropic/Gemini) sigue en la app.

Beneficios además del objetivo declarado: se arreglan **dos bugs reales** del flujo actual — el alta no-atómica que puede dejar bases huérfanas y la carrera TOCTOU del dup-check de EAN — y se elimina la asimetría acento-sensitive entre el prompt IA (acento-insensitive) y la canonicalización de la route (solo case-insensitive). **Esfuerzo estimado**: 3–5 días efectivos (3 migraciones + adelgazar route/servicio + tests de integración).

---

## Estado actual

Dónde vive cada pieza de normalización hoy:

| Pieza | Ubicación | ¿Ya en DB? |
| --- | --- | --- |
| Trim de `nombre`/`marca`/`categoria` de base | Trigger `normalizar_marca_categoria()` (`supabase/migrations/0004_mejoras_schema.sql:95`, redefinida en `0010_unicidad_bases.sql:10`) **+** trims duplicados en app (`src/services/catalogo.ts:249-251`) | Sí (trigger), duplicado en app |
| Unicidad case-insensitive de bases | Índice único `producto_bases_nombre_marca_uq (tienda_id, lower(trim(nombre)), lower(trim(coalesce(marca,''))))` (`0013_constraints_por_tienda.sql:92`) + lookup `ilike` de reutilización en app (`catalogo.ts:227-233`) | Sí (índice); la reutilización vive en app |
| Trim de claves/valores de atributos (jsonb) | `sanitizarAtributos()` (`catalogo.ts:192-198`) | No |
| Canonicalización de atributos contra `categoria_atributos.sugerencias` | `canonicalizarAtributos()` (`src/app/api/productos/crear-manual/route.ts:27-41`, con lookup de defs en `:89-100`) — **solo case-insensitive**, no acentos | **No** — solo en la API route |
| Canonicalización semántica de marca/categoría/base | Prompt del LLM (`src/services/parseoProducto.ts:81-128`, regla 1: matcheo case/acento-insensitive) | No (y no es determinística) |
| `nombre_completo` derivado | `armar_nombre_completo(p_tienda_id, ...)` + trigger `set_nombre_completo` (`0008_atributos_variantes.sql:87`, versión vigente `0015_rpcs_multitienda.sql:259-310`) | ✅ 100% en DB — es el modelo a seguir |
| Derivación de `tienda_id` en variantes | Trigger `trg_producto_variantes_derivar_tienda` (`0013_constraints_por_tienda.sql:59`) | ✅ 100% en DB |

Flujo de escritura: **todas** las escrituras a `producto_bases`/`producto_variantes` pasan por `POST /api/productos/crear-manual` → `crearProductoManual()` (`catalogo.ts:205-280`) con el cliente por-request del servidor. No hay escrituras de catálogo desde el browser.

Dos bugs del flujo actual que esta spec arregla de paso:

1. **Alta no-atómica** (`catalogo.ts:245-273`): el insert de base y el de variante son dos requests PostgREST sin transacción. Si el segundo falla (red, RLS, unique), queda una base huérfana sin variantes.
2. **Dup-check de EAN inconsistente y con carrera**: el check usa `dto.ean` sin trim (`catalogo.ts:222`) pero el insert usa `dto.ean.trim()` (`catalogo.ts:268`); y entre check e insert hay una ventana TOCTOU (dos requests concurrentes con el mismo EAN pasan ambas el check). Hoy la salva el índice único `producto_variantes_tienda_codigo_uq` (`0013:88`), pero el error llega como violación cruda, no como el mensaje "ya existe" que la route mapea a 409 (`crear-manual/route.ts:131`).

---

## Evaluación de alternativas

### Extensiones: `unaccent` sí; `citext` y `pg_trgm` no

- **`unaccent` — SÍ.** Hoy hay una asimetría real: el prompt del LLM exige matcheo acento-insensitive pero `canonicalizarAtributos()` solo compara case-insensitive ("Café" tipeado como "cafe" no matchea la sugerencia). La DB debe igualar el criterio más completo. `unaccent()` no es `IMMUTABLE` (depende del diccionario configurable), así que se necesita el wrapper estándar con diccionario fijado (§4.1).
- **`citext` — NO.** Cambiaría la semántica de columnas enteras, no resuelve acentos, y obligaría a recrear los índices únicos de la 0013 con riesgo de colisiones en datos vivos. Costo alto, beneficio redundante con los índices funcionales `lower(trim(...))` existentes.
- **`pg_trgm` — NO para el write path.** Matching difuso en escritura produce falsos merges ("Bimbo"/"Bimba" con umbral laxo). El matching "difuso" ya lo hace el LLM en tiempo de parseo, donde un humano confirma en pantalla; la DB debe ser determinística: igualdad sobre forma normalizada. Queda anotado como extensión futura para **búsqueda** (`buscarVariantes`), no para normalización.

### Trigger vs. RPC para la canonicalización de marca/categoría

**En trigger** (extensión del `normalizar_marca_categoria` existente), no dentro del RPC: el objetivo declarado es "toda la normalización en la DB", y un trigger cubre también imports masivos y fixes por SQL directo; el RPC lo hereda gratis. **Solo en INSERT**: si corriera en UPDATE, un admin que corrige deliberadamente "milex" → "Milex" sería revertido por la mayoría existente. Las altas se canonicalizan; las ediciones son deliberadas.

### `SELECT` previo + `ON CONFLICT` vs. `ON CONFLICT` solo (reutilización de base)

El lookup de reutilización es **más laxo** que el índice único (también acento-insensitive: "Bebé" reutiliza "Bebe", que el índice `lower(trim())` no colapsaría), así que el select previo es necesario de todos modos. El `ON CONFLICT ... DO UPDATE` sobre la expresión del índice queda como **red anti-carrera** para dos inserts concurrentes de la misma forma exacta (con `DO NOTHING` el `RETURNING` no devuelve fila; el `DO UPDATE` no-op sí).

### Preview: RPC read-only vs. aceptar la deriva

El problema (§4.4): la pantalla de confirmación muestra un preview calculado en app que puede diferir de lo que la DB persistirá. Alternativa descartada: aceptar la deriva y documentarla (la ventana es chica porque el LLM ya canonicaliza). Se descarta porque el RPC de preview cuesta ~10ms contra los ~2s del LLM y elimina la clase entera de bugs "confirmé una cosa y guardó otra". Además obliga a **factorizar** la normalización en helpers puros compartidos, garantizando por construcción que preview y write no divergen.

### La alternativa global: mover también el parseo LLM a la DB

Evaluada y documentada en el documento hermano ([`SPEC-NORMALIZACION-DB-CON-IA.md`](./SPEC-NORMALIZACION-DB-CON-IA.md)): pg_net + Vault. Resumen del trade-off: viable, pero convierte un flujo síncrono simple en una máquina de estados asíncrona con peor latencia y peor observabilidad. Esta spec toma el camino conservador: el LLM propone (app), la DB dispone (write).

---

## Diseño técnico

> §4.1–§4.3 son el **núcleo común** con el documento hermano — idénticos en ambas specs.

### 4.1 Extensiones y helpers (`f_unaccent`, `forma_normalizada`)

```sql
-- 0016_extensiones_normalizacion.sql
create extension if not exists unaccent with schema extensions;

-- Wrapper IMMUTABLE: unaccent() no lo es porque el diccionario es
-- configurable; fijarlo explícitamente es lo que justifica la inmutabilidad.
create function public.f_unaccent(p_texto text)
returns text
language sql immutable strict parallel safe
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, p_texto) $$;

-- Forma normalizada canónica de comparación: trim + colapso de whitespace
-- interno + sin acentos + minúsculas. Todo lookup de igualdad "flexible"
-- del catálogo debe pasar por acá — es LA definición de igualdad.
create function public.forma_normalizada(p_texto text)
returns text
language sql immutable strict parallel safe
set search_path = ''
as $$
  select lower(public.f_unaccent(regexp_replace(trim(p_texto), '\s+', ' ', 'g')))
$$;
```

**Decisión explícita: NO endurecer el índice único** `producto_bases_nombre_marca_uq` con `f_unaccent`. Si en producción ya coexisten "Bebé" y "Bebe" como bases distintas, recrear el índice acento-insensitive fallaría la migración. La acento-insensibilidad se aplica solo en los *lookups de reutilización* (que son un superconjunto: nunca chocan con el índice, solo reutilizan más agresivamente). Endurecerlo queda como pregunta abierta (§9), previa verificación de colisiones.

### 4.2 Triggers: saneo de atributos y canonicalización de marca/categoría

#### `sanear_atributos` (función pura, reutilizable)

Reemplaza a `canonicalizarAtributos()` (route) + `sanitizarAtributos()` (servicio), sumando acento-insensibilidad. Replica la semántica *replace-no-merge* de `armar_nombre_completo` (`0015:271-281`): una categoría con ≥1 definición propia reemplaza al default, no mergea.

```sql
-- 0017_normalizacion_en_db.sql (fragmento)
create function sanear_atributos(p_tienda_id uuid, p_categoria text, p_atributos jsonb)
returns jsonb
language sql stable
security invoker
set search_path = public
as $$
  with defs as (
    select clave, sugerencias from categoria_atributos
    where tienda_id = p_tienda_id and categoria = p_categoria
    union all
    select clave, sugerencias from categoria_atributos
    where tienda_id = p_tienda_id and categoria is null
      and not exists (
        select 1 from categoria_atributos
        where tienda_id = p_tienda_id and categoria = p_categoria
      )
  ),
  limpios as (
    select trim(a.clave) as clave,
           regexp_replace(trim(a.valor), '\s+', ' ', 'g') as valor
    from jsonb_each_text(p_atributos) as a(clave, valor)
  ),
  canonicos as (
    select l.clave,
           coalesce(
             (select s.sugerencia
              from defs d, unnest(d.sugerencias) as s(sugerencia)
              where d.clave = l.clave
                and forma_normalizada(s.sugerencia) = forma_normalizada(l.valor)
              limit 1),
             l.valor
           ) as valor
    from limpios l
    where l.clave <> '' and l.valor <> ''
  )
  select coalesce(jsonb_object_agg(clave, valor), '{}'::jsonb) from canonicos
$$;
```

Edge case declarado: dos claves que colisionan tras el trim (`"sabor "` y `"sabor"`) resuelven last-wins no-determinístico en `jsonb_object_agg` — mismo comportamiento que el `Object.fromEntries` actual; aceptable.

#### Trigger `trg_producto_variantes_limpiar_atributos`

```sql
create function limpiar_atributos_variante()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_categoria text;
begin
  new.atributos = coalesce(new.atributos, '{}'::jsonb);
  if new.atributos = '{}'::jsonb then
    return new;
  end if;

  -- Categoría de la base: en contexto invoker el select respeta RLS
  -- (misma tienda), y new.tienda_id ya lo puso el trigger de derivación.
  select categoria into v_categoria
  from producto_bases where id = new.producto_base_id;

  new.atributos = sanear_atributos(new.tienda_id, v_categoria, new.atributos);
  return new;
end;
$$;

create trigger trg_producto_variantes_limpiar_atributos
  before insert or update of atributos on producto_variantes
  for each row execute function limpiar_atributos_variante();
```

**El nombre del trigger es parte del diseño.** Postgres dispara los triggers del mismo evento en orden alfabético. En `producto_variantes` ya existen `trg_producto_variantes_derivar_tienda` (BEFORE INSERT, `0013:59`) y `trg_producto_variantes_nombre_completo` (BEFORE INSERT OR UPDATE, `0008:145`). El nuevo debe correr **después** de derivar (necesita `new.tienda_id`) y **antes** de nombre_completo (que arma el nombre desde atributos ya saneados): `derivar` < `limpiar` < `nombre` ✓. Regla escrita para el futuro (precedente: comentario en `0015:253-254`): **todo trigger nuevo en `producto_variantes` debe elegir su nombre considerando el orden alfabético relativo a estos tres.**

#### Canonicalización de marca/categoría (extensión de `normalizar_marca_categoria`)

Helpers factorizados (los reutiliza el RPC de preview de §4.4):

```sql
create function marca_canonica(p_tienda_id uuid, p_marca text)
returns text
language sql stable security invoker set search_path = public
as $$
  select coalesce(
    (select marca from producto_bases
     where tienda_id = p_tienda_id
       and forma_normalizada(marca) = forma_normalizada(p_marca)
     limit 1),
    p_marca)
$$;

create function categoria_canonica(p_tienda_id uuid, p_categoria text)
returns text
language sql stable security invoker set search_path = public
as $$
  select coalesce(
    (select categoria from producto_bases
     where tienda_id = p_tienda_id
       and forma_normalizada(categoria) = forma_normalizada(p_categoria)
     limit 1),
    p_categoria)
$$;

create or replace function normalizar_marca_categoria()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.nombre = regexp_replace(trim(new.nombre), '\s+', ' ', 'g');
  new.marca = nullif(regexp_replace(trim(coalesce(new.marca, '')), '\s+', ' ', 'g'), '');
  new.categoria = nullif(regexp_replace(trim(coalesce(new.categoria, '')), '\s+', ' ', 'g'), '');

  -- Solo en INSERT: las altas se canonicalizan contra lo existente de la
  -- tienda ("MILEX" → "Milex"); las ediciones son deliberadas y no deben
  -- ser revertidas por la mayoría.
  if tg_op = 'INSERT' then
    if new.marca is not null then
      new.marca = marca_canonica(new.tienda_id, new.marca);
    end if;
    if new.categoria is not null then
      new.categoria = categoria_canonica(new.tienda_id, new.categoria);
    end if;
  end if;
  return new;
end;
$$;
```

Notas: el trigger ya existe (`trg_producto_bases_normalizar`, `0004:104`) — solo se reemplaza la función. En BEFORE INSERT el self-select no ve la fila nueva (aún no insertada), así que no hay auto-match. En contexto invoker el lookup respeta RLS → solo canonicaliza contra la propia tienda. Novedad respecto de la versión 0010: colapso de whitespace **interno** (`"Leche  Entera"` → `"Leche Entera"`), igual que hacía `canonicalizarAtributos` en app.

#### Backfill

```sql
-- Dispara limpiar_atributos + set_nombre_completo sobre lo existente.
update producto_variantes set atributos = atributos;
```

Corre como owner de la migración (bypasea RLS: cruza todas las tiendas, correcto para un backfill). Dos consecuencias: (a) los `nombre_completo` pueden cambiar donde había valores no canónicos; (b) el catálogo cacheado en IndexedDB (`useCatalogoCompleto`) queda stale hasta el próximo sync → coordinar bump del buster del query persister en el deploy de app (§7).

### 4.3 RPC transaccional `crear_producto_manual`

Reemplaza la lógica de `crearProductoManual()` (`catalogo.ts:205-280`). Convención de la 0015: `security invoker` (RLS es el único enforcement para data-RPCs), `set search_path = public`, revoke a `public`/`anon`, grant a `authenticated`/`service_role`.

```sql
-- 0018_rpc_crear_producto_manual.sql
create function crear_producto_manual(
  p_tienda_id uuid,
  p_ean text,
  p_nombre text,
  p_marca text,
  p_categoria text default null,
  p_atributos jsonb default '{}'::jsonb,
  p_imagen_base text default null,
  p_imagen_variante text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_ean text := trim(coalesce(p_ean, ''));
  v_base producto_bases%rowtype;
  v_variante producto_variantes%rowtype;
begin
  if v_ean = '' or trim(coalesce(p_nombre, '')) = '' or trim(coalesce(p_marca, '')) = '' then
    raise exception 'Faltan campos requeridos';
  end if;

  -- Dup-check temprano para el mensaje amigable; la carrera real la cierra
  -- el guard de unique_violation de abajo.
  if exists (select 1 from producto_variantes
             where tienda_id = p_tienda_id and codigo_barras = v_ean) then
    raise exception 'Este código de barras ya existe en el catálogo';
  end if;

  -- Reutilización de base, acento/case-insensitive. Más laxa que el índice
  -- único, por eso el select previo además del ON CONFLICT.
  select * into v_base from producto_bases
  where tienda_id = p_tienda_id
    and forma_normalizada(nombre) = forma_normalizada(p_nombre)
    and forma_normalizada(coalesce(marca, '')) = forma_normalizada(coalesce(p_marca, ''))
  limit 1;

  if v_base.id is null then
    insert into producto_bases (tienda_id, nombre, marca, categoria, imagen)
    values (p_tienda_id, p_nombre, p_marca, p_categoria, p_imagen_base)
    -- Red anti-carrera sobre la expresión del índice único de la 0013.
    -- DO UPDATE no-op (y no DO NOTHING) para que RETURNING devuelva la fila.
    on conflict (tienda_id, (lower(trim(nombre))), (lower(trim(coalesce(marca, '')))))
      do update set updated_at = now()
    returning * into v_base;
  end if;

  begin
    -- Sin nombre_completo ni tienda_id: los ponen los triggers (0008/0013),
    -- y limpiar_atributos sanea/canonicaliza el jsonb (0017).
    insert into producto_variantes (producto_base_id, codigo_barras, atributos, imagen)
    values (v_base.id, v_ean, coalesce(p_atributos, '{}'::jsonb), p_imagen_variante)
    returning * into v_variante;
  exception when unique_violation then
    -- Cierra el TOCTOU del check inicial con el mismo mensaje-contrato.
    raise exception 'Este código de barras ya existe en el catálogo';
  end;

  -- returning * ya refleja lo que pusieron los triggers BEFORE.
  return jsonb_build_object('base', to_jsonb(v_base), 'variante', to_jsonb(v_variante));
end;
$$;

revoke all on function crear_producto_manual(uuid, text, text, text, text, jsonb, text, text)
  from public, anon;
grant execute on function crear_producto_manual(uuid, text, text, text, text, jsonb, text, text)
  to authenticated, service_role;
```

**Contrato de error**: el mensaje `'Este código de barras ya existe en el catálogo'` es un contrato con la route, que mapea por substring `"ya existe"` a 409 (`crear-manual/route.ts:131`). Se mantiene tal cual. Mejora opcional (no bloqueante): `errcode` custom (`P0409`) y mapear por código en vez de por substring.

**Atomicidad**: el cuerpo de la función es una única transacción — desaparece el bug de base huérfana del flujo actual de dos inserts.

### 4.4 Contrato parseo (app) ↔ normalización (DB) y RPC de preview

El parseo LLM queda como está (`parsearProducto`, `parseoProducto.ts:295`; route `parsear/route.ts`). El contrato pasa a ser: **la salida del LLM es una propuesta; la DB es la autoridad de la forma canónica en el write**. El LLM ya intenta canonicalizar (reglas 1–5 del prompt, `parseoProducto.ts:107-128`) pero puede fallar — modelo nuevo, fallback Gemini, catálogo desactualizado en el prompt cacheado — y la DB corrige silenciosamente en el insert.

**Problema de deriva**: `ManualProductSheet` (`src/components/scanner/ManualProductSheet.tsx:244`) muestra un `nombrePreview` calculado en app (`construirNombreCompleto`, `parsear/route.ts:82`) y los atributos crudos del parseo. Lo que la DB persiste puede diferir (canonicalización acento-insensitive, marca reutilizada con otra capitalización). El usuario confirmaría "X" y vería guardado "X′".

**Solución: RPC read-only `previsualizar_normalizacion`** que ejecuta *el mismo código* que el write (por eso los helpers factorizados de §4.2):

```sql
-- 0019_rpc_previsualizar_normalizacion.sql
create function previsualizar_normalizacion(
  p_tienda_id uuid,
  p_nombre text,
  p_marca text,
  p_categoria text default null,
  p_atributos jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_nombre text := regexp_replace(trim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  v_marca text := nullif(regexp_replace(trim(coalesce(p_marca, '')), '\s+', ' ', 'g'), '');
  v_categoria text := nullif(regexp_replace(trim(coalesce(p_categoria, '')), '\s+', ' ', 'g'), '');
  v_base producto_bases%rowtype;
  v_atributos jsonb;
begin
  -- Misma reutilización de base que crear_producto_manual.
  select * into v_base from producto_bases
  where tienda_id = p_tienda_id
    and forma_normalizada(nombre) = forma_normalizada(v_nombre)
    and forma_normalizada(coalesce(marca, '')) = forma_normalizada(coalesce(v_marca, ''))
  limit 1;

  if v_base.id is not null then
    v_nombre := v_base.nombre;
    v_marca := v_base.marca;
    v_categoria := v_base.categoria;
  else
    v_marca := marca_canonica(p_tienda_id, v_marca);
    v_categoria := categoria_canonica(p_tienda_id, v_categoria);
  end if;

  v_atributos := sanear_atributos(p_tienda_id, v_categoria, coalesce(p_atributos, '{}'::jsonb));

  return jsonb_build_object(
    'nombre', v_nombre,
    'marca', v_marca,
    'categoria', v_categoria,
    'atributos', v_atributos,
    'nombreCompleto', armar_nombre_completo(p_tienda_id, v_nombre, v_categoria, v_atributos),
    'baseReutilizada', v_base.id is not null,
    'baseId', v_base.id
  );
end;
$$;
-- revoke/grant idénticos a crear_producto_manual.
```

La route `/api/productos/parsear` lo invoca después del LLM y devuelve `{parsed: <normalizado>, nombrePreview: <nombreCompleto>}` — la pantalla de confirmación muestra **literalmente lo que se guardará**, y `construirNombreCompleto`/`ORDEN_ATRIBUTOS_DEFAULT` dejan de usarse en este flujo. Costo: +1 RPC (~10ms) contra los ~2s del LLM, despreciable. El flujo de confirmación ya es online-only (el parseo lo es), así que no empeora offline.

### 4.5 Cambios en la capa de aplicación

| Pieza | Destino |
| --- | --- |
| `canonicalizarAtributos()` + lookup de defs (`crear-manual/route.ts:27-41`, `:89-100`) | **Se borra** — lo hace el trigger 0017 |
| `sanitizarAtributos()` (`catalogo.ts:192-198`) | **Se borra** |
| `crearProductoManual()` (`catalogo.ts:205-280`) | Se reduce a `client.rpc("crear_producto_manual", {...})` + mapeo snake_case→DTO (reutiliza `mapProductoBase`/`mapProductoVariante`) |
| `POST /api/productos/crear-manual` | Proxy fino: auth 401 → validación de shape (`esObjetoPlanoDeStrings` **se queda**: un 400 temprano es mejor UX que un error plpgsql) → rpc → mapeo `"ya existe"`→409 (sin cambios) |
| `POST /api/productos/parsear` | Tras el LLM, invoca `previsualizar_normalizacion` y devuelve el resultado normalizado |
| `construirNombreCompleto` en el preview (`parsear/route.ts:82`) | Se reemplaza por el `nombreCompleto` del RPC |
| Trims de `mapearRespuestaParseo` (`parseoProducto.ts:135`) | **Se quedan** — higiene de la respuesta del LLM antes de mostrar en UI, no normalización de persistencia |

---

## Plan de migraciones

| # | Archivo | Contenido |
| --- | --- | --- |
| 0016 | `0016_extensiones_normalizacion.sql` | `unaccent` + `f_unaccent` + `forma_normalizada` |
| 0017 | `0017_normalizacion_en_db.sql` | `sanear_atributos`, `limpiar_atributos_variante` + trigger, `marca_canonica`/`categoria_canonica`, `normalizar_marca_categoria` extendida, backfill de atributos |
| 0018 | `0018_rpc_crear_producto_manual.sql` | `crear_producto_manual` + revoke/grant |
| 0019 | `0019_rpc_previsualizar_normalizacion.sql` | `previsualizar_normalizacion` + revoke/grant |

Nada de secretos ni configuración manual: las cuatro migraciones son SQL puro y aditivo.

---

## Plan de testing

**Unit (vitest, mocks)** — `src/services/__tests__/catalogo.test.ts`: reescribir los casos de `crearProductoManual` contra un mock de `client.rpc` (verifica parámetros enviados y mapeo de respuesta/error), eliminando los mocks encadenados de `.from().select()...`. Los tests de `canonicalizarAtributos` de la route se retiran junto con la función.

**Integración (vitest contra Supabase real, patrón `src/tests/integration/aislamiento-rls.test.ts`)** — casos nuevos:

1. Saneo de atributos: trims, descarte de vacíos, canonicalización con y sin acentos ("vainilla"/"VAINILLA"/"Vainílla" → sugerencia canónica), semántica replace-no-merge de definiciones.
2. Reutilización de base: "MILEX" → base "Milex"; "Bebé" → base "Bebe" (acento-insensitive, más laxa que el índice).
3. Canonicalización de marca en INSERT de base nueva; verificación de que un UPDATE deliberado NO se revierte.
4. EAN duplicado → error con mensaje `"ya existe"`; mismo EAN en dos tiendas → OK.
5. Atomicidad: forzar fallo del insert de variante → no queda base huérfana.
6. `previsualizar_normalizacion` devuelve exactamente lo que `crear_producto_manual` persiste (mismo input → comparar salida del preview con la fila creada).
7. Aislamiento: el RPC contra una tienda ajena falla por RLS.

---

## Rollout / Rollback

**Orden de deploy: DB antes que app.** Las migraciones 0016–0019 son aditivas: la app actual sigue funcionando durante y después (su sanitización JS se vuelve redundante e idempotente — el trigger re-sanea lo ya saneado sin efecto). El deploy de app (route adelgazada + rpc) va después, junto con el bump del buster del query persister (el backfill puede haber cambiado `nombre_completo` de datos cacheados en IndexedDB).

**Rollback**: 0016/0017/0019 se revierten solas (drop de triggers/funciones) sin romper ninguna versión de la app. La app nueva **depende** del RPC de 0018 → revertir 0018 exige revertir la app primero. Documentar este orden en el runbook del deploy.

---

## Riesgos

1. **Deriva residual por escrituras fuera del flujo**: alguien que inserte por SQL directo con `service_role` bypasea RLS pero NO los triggers — la normalización determinística lo cubre. Lo que no cubre: la canonicalización de marca solo corre en INSERT; un UPDATE masivo por SQL puede introducir formas no canónicas deliberadamente. Aceptado por diseño.
2. **Colisión de claves post-trim** en el jsonb: last-wins no determinístico (mismo comportamiento actual). Declarado en §4.2.
3. **El backfill cambia `nombre_completo` de datos vivos**: catálogos offline stale hasta el próximo sync. Mitigación: bump del persister en el mismo deploy.
4. **Performance del trigger**: `sanear_atributos` hace un lookup de `categoria_atributos` + `unnest` de sugerencias por fila insertada/actualizada. A la escala actual (altas manuales unitarias, backfill de cientos de filas) es despreciable; para un futuro import masivo, medir.
5. **Acoplamiento por mensaje de error** (`"ya existe"` → 409): funciona, pero es frágil ante reformulaciones. Mejora opcional: `errcode` custom.
6. **Hueco preexistente** (no introducido por esta spec): `derivar_tienda_desde_base` es BEFORE INSERT solamente; un hipotético UPDATE de `producto_base_id` cross-tienda no re-derivaría `tienda_id`. Anotado en §9.

---

## Preguntas abiertas

1. ¿Endurecer el índice único `producto_bases_nombre_marca_uq` con `f_unaccent`? Requiere verificar antes en producción: `select forma_normalizada(nombre), forma_normalizada(coalesce(marca,'')), count(*) from producto_bases group by 1, 2 having count(*) > 1`.
2. ¿Habilitar `pg_trgm` para búsqueda difusa en `buscarVariantes` (fuera del write path)?
3. ¿Migrar el contrato de error a `errcode` custom (`P0409`) en route y RPC?
4. ¿Agregar trigger de re-derivación de `tienda_id` en UPDATE de `producto_base_id` (hueco preexistente de la 0013)?
