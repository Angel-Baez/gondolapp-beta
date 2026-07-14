# 🤖 Spec: Normalización de catálogo en la capa de DB — CON IA en la DB (pg_net + Vault)

> **Estado**: Propuesta para revisión. No implementado.
> **Fecha**: julio 2026.
> **Verificada contra**: main `2d6adaf` (2026-07-14). Cada cita `archivo:línea` fue contrastada contra ese árbol. **Regla operativa** (heredada de `SPECMULTIUSER.md`): re-verificar el inventario de "Estado actual" antes de arrancar cada fase.
> **Documento hermano**: [`SPEC-NORMALIZACION-DB-SIN-IA.md`](./SPEC-NORMALIZACION-DB-SIN-IA.md). Ambas specs comparten el **núcleo determinístico** (§4.1–§4.3 son idénticos); difieren en dónde vive el parseo con LLM: acá se invoca desde Postgres con pg_net + Vault, allá queda en la capa de aplicación.
> **Decisiones base**: toda la normalización en DB, incluida la invocación del LLM · mecanismo pg_net (HTTP desde Postgres) + Supabase Vault para las API keys · el contrato con la UI pasa de síncrono a encolar + polling.

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

Hoy la normalización del catálogo está repartida en tres capas: un trigger de Postgres que solo trimea `producto_bases`, funciones TypeScript en la route y el servicio de catálogo, y el prompt del parseo con IA. Esta spec mueve **todo** a la base de datos: la normalización determinística (triggers + funciones SQL, idéntica al documento hermano) **y además** el parseo con LLM, que pasa a invocarse desde Postgres con `pg_net` (HTTP asíncrono) y Supabase Vault (API keys).

Qué se mueve a DB:

- Saneo y canonicalización de atributos, marca y categoría → triggers + funciones SQL (§4.1–§4.2).
- El alta atómica base+variante → RPC transaccional `crear_producto_manual` (§4.3).
- **El parseo LLM completo**: construcción del system prompt en SQL, llamada a Anthropic/Gemini vía `net.http_post`, validación de la respuesta en plpgsql, fallback y rate limiting en DB (§4.4). Las routes `/api/productos/parsear` y su lógica en `src/services/parseoProducto.ts` desaparecen.

**Advertencia honesta, para decidir con los ojos abiertos**: el núcleo determinístico (§4.1–§4.3) es ganancia neta clara — arregla dos bugs reales y unifica la autoridad canónica. La parte IA-en-DB es **técnicamente viable pero con trade-offs netos negativos** frente al flujo síncrono actual: `pg_net` es asíncrono sin remedio (el contrato con la UI pasa a encolar + polling, +1–2s de latencia media), la observabilidad empeora (debug por SQL en vez de logs/SDK), cada iteración de prompt se vuelve una migración, y se profundiza el lock-in a Supabase. Se elimina ~250 líneas de TypeScript que hoy funcionan bien. La sección de [Riesgos](#riesgos) lo detalla; la decisión es del lector. **Esfuerzo estimado**: 8–12 días efectivos (6 migraciones + reescritura del flujo de UI + tests).

---

## Estado actual

Dónde vive cada pieza de normalización hoy:

| Pieza | Ubicación | ¿Ya en DB? |
| --- | --- | --- |
| Trim de `nombre`/`marca`/`categoria` de base | Trigger `normalizar_marca_categoria()` (`supabase/migrations/0004_mejoras_schema.sql:95`, redefinida en `0010_unicidad_bases.sql:10`) **+** trims duplicados en app (`src/services/catalogo.ts:249-251`) | Sí (trigger), duplicado en app |
| Unicidad case-insensitive de bases | Índice único `producto_bases_nombre_marca_uq (tienda_id, lower(trim(nombre)), lower(trim(coalesce(marca,''))))` (`0013_constraints_por_tienda.sql:92`) + lookup `ilike` de reutilización en app (`catalogo.ts:227-233`) | Sí (índice); la reutilización vive en app |
| Trim de claves/valores de atributos (jsonb) | `sanitizarAtributos()` (`catalogo.ts:192-198`) | No |
| Canonicalización de atributos contra `categoria_atributos.sugerencias` | `canonicalizarAtributos()` (`src/app/api/productos/crear-manual/route.ts:27-41`, con lookup de defs en `:89-100`) — **solo case-insensitive**, no acentos | **No** — solo en la API route |
| Canonicalización semántica de marca/categoría/base | Prompt del LLM (`src/services/parseoProducto.ts:81-128`, regla 1: matcheo case/acento-insensitive) | No |
| Parseo LLM (Anthropic `claude-haiku-4-5` con prompt caching y json_schema, fallback Gemini `gemini-3.1-flash-lite`) | `parsearProducto()` (`parseoProducto.ts:295`) invocado por `POST /api/productos/parsear` (síncrono, texto ≤200 chars); validación en `mapearRespuestaParseo()` (`parseoProducto.ts:135`) | **No** — capa app |
| `nombre_completo` derivado | `armar_nombre_completo(p_tienda_id, ...)` + trigger `set_nombre_completo` (`0008_atributos_variantes.sql:87`, versión vigente `0015_rpcs_multitienda.sql:259-310`) | ✅ 100% en DB — es el modelo a seguir |
| Derivación de `tienda_id` en variantes | Trigger `trg_producto_variantes_derivar_tienda` (`0013_constraints_por_tienda.sql:59`) | ✅ 100% en DB |
| Rate limiting del parseo | Upstash en el proxy de Next (`src/proxy.ts:46-68`, 15/min para creates) | No |

Flujo actual del parseo: `ManualProductSheet` (`src/components/scanner/ManualProductSheet.tsx:103-129`) → `fetch("/api/productos/parsear")` → `parsearProducto` lee marcas/categorías/bases/definiciones de la tienda, arma el system prompt con **orden determinístico de bases** (`parseoProducto.ts:314-319`, crítico: el prompt caching de Anthropic pega por prefijo exacto de bytes), llama al LLM y devuelve `{parsed, nombrePreview}` **sin persistir nada**; la persistencia ocurre al confirmar, vía `POST /api/productos/crear-manual` → `crearProductoManual()` (`catalogo.ts:205-280`).

Infra DB actual relevante: única extensión `pgcrypto` (`0001_init.sql:4`). **No** hay `pg_net`, `pg_cron`, Vault en uso ni Edge Functions. Convención de RPCs (0015): data-RPCs `security invoker` (RLS es el único enforcement), RPCs de organización `security definer` con guards internos, `set search_path = public`, revoke a `public`/`anon`.

Dos bugs del flujo actual que esta spec arregla de paso (detalle en el documento hermano, §Estado actual): el alta no-atómica de base+variante (`catalogo.ts:245-273`, base huérfana si falla el segundo insert) y la carrera TOCTOU del dup-check de EAN (`catalogo.ts:222` sin trim vs `:268` con trim).

---

## Evaluación de alternativas

### Núcleo determinístico

Idéntica al documento hermano (§Evaluación de alternativas): `unaccent` sí (con wrapper IMMUTABLE); `citext` no (recrear índices vivos, no resuelve acentos); `pg_trgm` no para escritura (falsos merges — el matching difuso lo hace el LLM con confirmación humana); canonicalización de marca en trigger y solo en INSERT; select previo + `ON CONFLICT` como red anti-carrera.

### Cómo procesar la asincronía de pg_net — tres opciones

**`pg_net` es asíncrono sin remedio**: `net.http_post(...)` devuelve un `bigint request_id` y la respuesta aparece más tarde en la tabla `net._http_response`. No hay modo síncrono ni streaming. El contrato con la UI debe rediseñarse como **encolar + consultar**.

1. **Tabla `parseos` + polling del cliente — ELEGIDA.** RPC `solicitar_parseo` encola y devuelve un id; el cliente polea `obtener_parseo(id)`, que procesa la respuesta "on read". Estado explícito, observable, con RLS normal, testeable, y el cliente ya tiene TanStack Query para poll.
2. **pg_cron como procesador principal — descartada como camino crítico, adoptada como janitor.** pg_cron ≥1.5 (Supabase trae 1.6) soporta schedules en segundos, pero meter granularidad de cron en el camino crítico suma ~1s de latencia media y llena `cron.job_run_details` de ruido. Se usa cada 15–30s solo para: disparar el fallback Gemini de requests fallidos que nadie polea, marcar `timeout` los parseos viejos y limpiar filas antiguas.
3. **Trigger sobre `net._http_response` — DESCARTADA.** Es una tabla interna (prefijo `_`) sin contrato de estabilidad; el worker de pg_net ha cambiado entre versiones cómo inserta/borra (batching, TTL de limpieza ~6h). La propia documentación de Supabase recomienda no depender de ella más que para lectura puntual por `request_id`. Un trigger ahí es acoplarse a un detalle de implementación en beta.

**Realtime en vez de polling — descartada**: un channel por parseo de 2–4s de vida es más infraestructura (publication + RLS de realtime) que un poll corto con tope.

### Route como proxy vs. cliente directo a RPCs

**Elegida: el cliente llama los RPCs directo y `/api/productos/parsear` se elimina** — coherente con el objetivo "todo en DB". Alternativa transicional documentada: mantener la route como proxy que encola y polea server-side conservando el contrato síncrono `{parsed, nombrePreview}` (cero cambios en `ManualProductSheet`), pero mantiene la función serverless ocupada durante todo el parseo (timeout/costo en Vercel) y renuncia a la mitad del beneficio.

### La alternativa global: dejar el LLM en la app

Es el documento hermano ([`SPEC-NORMALIZACION-DB-SIN-IA.md`](./SPEC-NORMALIZACION-DB-SIN-IA.md)): mismo núcleo determinístico, parseo síncrono intacto, y un RPC read-only de preview para eliminar la deriva preview/persistencia. Si el criterio dominante es riesgo/esfuerzo/UX, esa spec es la recomendada; esta existe para cuando el criterio dominante es "una sola capa dueña de todo el pipeline de datos".

---

## Diseño técnico

> §4.1–§4.3 son el **núcleo común** con el documento hermano — idénticos en ambas specs. Se transcriben completos allá; acá se resumen firma y decisiones para no duplicar mantenimiento. **Fuente canónica del SQL del núcleo: el documento hermano.**

### 4.1 Extensiones y helpers (`f_unaccent`, `forma_normalizada`)

Migración 0016: `create extension unaccent` (schema `extensions`) + wrapper `f_unaccent(text)` IMMUTABLE con diccionario fijado (`unaccent()` no es immutable por defecto) + `forma_normalizada(text)` = `lower(f_unaccent(regexp_replace(trim(...), '\s+', ' ', 'g')))` — LA definición de igualdad flexible del catálogo. Decisión explícita: **NO** endurecer el índice único `producto_bases_nombre_marca_uq` con unaccent (riesgo de colisión con datos vivos); la acento-insensibilidad aplica solo a los lookups de reutilización.

### 4.2 Triggers de saneo y canonicalización

Migración 0017:

- `sanear_atributos(p_tienda_id, p_categoria, p_atributos) returns jsonb`: trim de claves/valores, descarte de vacíos, canonicalización contra `categoria_atributos.sugerencias` con `forma_normalizada` (semántica replace-no-merge igual a `armar_nombre_completo`, `0015:271-281`). Reemplaza `canonicalizarAtributos` + `sanitizarAtributos`.
- Trigger `trg_producto_variantes_limpiar_atributos` BEFORE INSERT OR UPDATE OF `atributos`. **El nombre es parte del diseño**: los triggers del mismo evento disparan en orden alfabético y este debe correr después de `trg_producto_variantes_derivar_tienda` (`0013:59`, necesita `new.tienda_id`) y antes de `trg_producto_variantes_nombre_completo` (`0008:145`): `derivar` < `limpiar` < `nombre` ✓.
- Helpers `marca_canonica(p_tienda_id, p_marca)` / `categoria_canonica(...)` + `normalizar_marca_categoria()` extendida: en INSERT canonicaliza marca/categoría contra los valores existentes de la tienda ("MILEX" → "Milex"); en UPDATE no (las ediciones son deliberadas). Suma colapso de whitespace interno.
- Backfill `update producto_variantes set atributos = atributos;` — recomputa saneo + `nombre_completo`; coordina el bump del buster del query persister (catálogo IndexedDB stale).

### 4.3 RPC transaccional `crear_producto_manual`

Migración 0018. `security invoker`, `set search_path = public`, revoke `public`/`anon`, grant `authenticated`/`service_role`. Firma:

```sql
crear_producto_manual(
  p_tienda_id uuid, p_ean text, p_nombre text, p_marca text,
  p_categoria text default null, p_atributos jsonb default '{}'::jsonb,
  p_imagen_base text default null, p_imagen_variante text default null
) returns jsonb  -- {base, variante}
```

Pasos: validación de requeridos → dup-check EAN con excepción `'Este código de barras ya existe en el catálogo'` (contrato substring `"ya existe"` → 409, `crear-manual/route.ts:131`) → reutilización de base acento/case-insensitive (select previo con `forma_normalizada`) → insert de base con `ON CONFLICT ... DO UPDATE` no-op sobre la expresión del índice único como red anti-carrera → insert de variante con guard `exception when unique_violation` (cierra el TOCTOU) → `jsonb_build_object('base', ..., 'variante', ...)`. Una sola transacción: desaparece la base huérfana.

### 4.4 Parseo LLM desde Postgres (pg_net + Vault) — exclusivo de esta spec

#### 4.4.1 Tabla de estado `parseos`

```sql
-- 0019_parseos_infra.sql (fragmento)
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
-- Vault viene preinstalado en Supabase (schema vault); verificar disponibilidad.

create table parseos (
  id uuid primary key default gen_random_uuid(),
  tienda_id uuid not null references tiendas(id),
  user_id uuid not null default auth.uid(),
  texto text not null check (char_length(texto) <= 200),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'procesando', 'ok', 'error', 'timeout')),
  proveedor text not null default 'anthropic'
    check (proveedor in ('anthropic', 'gemini')),
  request_id bigint,          -- request vigente en pg_net
  resultado jsonb,            -- ProductoParseado validado + nombrePreview
  error text,
  debug jsonb,                -- status HTTP, ms, tokens: observabilidad mínima
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

alter table parseos enable row level security;
-- SELECT/INSERT solo del dueño y su tienda:
--   using (user_id = auth.uid() and tienda_id in (select mis_tiendas()))
-- Sin UPDATE/DELETE para authenticated: el estado lo mutan solo las
-- funciones SECURITY DEFINER de §4.4.2.
```

#### 4.4.2 RPCs `solicitar_parseo` y `obtener_parseo`

Ambas **SECURITY DEFINER** (necesitan el schema `net` y Vault, que jamás se otorgan a `authenticated`), con guards internos explícitos al estilo de las RPCs de organización de la 0015 (definer bypasea RLS, así que la membresía se chequea a mano):

```sql
create function solicitar_parseo(p_tienda_id uuid, p_texto text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parseo_id uuid;
  v_request_id bigint;
  v_proveedor text;
begin
  -- Guards: sesión, membresía, largo, rate limit.
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if not exists (select 1 from tienda_miembros
                 where tienda_id = p_tienda_id and user_id = auth.uid()) then
    raise exception 'No sos miembro de esta tienda';
  end if;
  if char_length(trim(coalesce(p_texto, ''))) not between 1 and 200 then
    raise exception 'El texto debe tener entre 1 y 200 caracteres';
  end if;
  -- Rate limit en DB (reemplaza al Upstash de la route, y mejor: por
  -- usuario y no por IP, no bypasseable llamando al RPC directo).
  if (select count(*) from parseos
      where user_id = auth.uid()
        and creado_at > now() - interval '1 minute') >= 15 then
    raise exception 'Demasiadas solicitudes, esperá un momento';
  end if;

  v_proveedor := case when parseo_api_key('anthropic') is not null
                      then 'anthropic' else 'gemini' end;
  if parseo_api_key(v_proveedor) is null then
    raise exception 'IA no configurada';   -- contrato: la UI lo trata como el 503 actual
  end if;

  insert into parseos (tienda_id, user_id, texto, proveedor)
  values (p_tienda_id, auth.uid(), trim(p_texto), v_proveedor)
  returning id into v_parseo_id;

  v_request_id := encolar_llamada_llm(v_parseo_id);  -- net.http_post, ver 4.4.4
  update parseos set request_id = v_request_id where id = v_parseo_id;
  return v_parseo_id;
end;
$$;
```

```sql
create function obtener_parseo(p_id uuid)
returns jsonb   -- {estado, resultado?, error?}
language plpgsql
security definer
set search_path = public
as $$
-- Guard: la fila debe ser del usuario (user_id = auth.uid()).
-- Si estado in ('ok','error','timeout'): devuelve directo.
-- Si pendiente/procesando: lee net._http_response where id = request_id
--   (lectura puntual por id: el único uso aceptado de esa tabla interna).
--   * Respuesta 200 → validar_respuesta_parseo() (4.4.5); si valida,
--     normaliza el resultado con los helpers del núcleo (sanear_atributos,
--     marca_canonica) y calcula nombrePreview con armar_nombre_completo
--     → estado 'ok'. La preview muestra EXACTAMENTE lo que se persistirá.
--   * Error/status≠200/validación fallida y proveedor='anthropic' →
--     proveedor='gemini', encolar_llamada_llm de nuevo, estado 'procesando'.
--   * Falla también Gemini → estado 'error'.
-- El procesamiento "on read" hace que el happy path NO dependa de pg_cron.
$$;
```

**Cliente**: `ManualProductSheet` llama `supabase.rpc("solicitar_parseo", ...)` y polea `obtener_parseo` cada ~700ms con tope ~20s (TanStack Query `refetchInterval`). `handleAnalizar` (`ManualProductSheet.tsx:103`) pasa de un `fetch` único a encolar + poll; el resto del flujo (confirmar → `crear_producto_manual`) no cambia. `nombrePreview` viene del RPC (calculado en DB con `armar_nombre_completo`), eliminando también `construirNombreCompleto` del preview (`parsear/route.ts:82`).

#### 4.4.3 Vault (API keys)

- **Alta de secretos: manual, NUNCA en migraciones** (quedarían en el repo). Procedimiento documentado en el runbook del deploy, equivalente al paso "setear env vars en Vercel": `select vault.create_secret('<key>', 'anthropic_api_key');` (ídem `gemini_api_key`) desde el SQL editor del dashboard.
- Lectura: helper interno `parseo_api_key(p_proveedor text)` — función **SECURITY DEFINER sin grant a nadie** salvo las dos RPCs (o directamente inlineado en ellas): `select decrypted_secret from vault.decrypted_secrets where name = p_proveedor || '_api_key'`. Jamás grant de `vault.*` a `authenticated`; jamás una función que devuelva el secreto al invoker.
- **Riesgo declarado**: la key viaja en los headers del request y es visible en `net.http_request_queue` (y metadata de `net._http_response`) para roles con acceso al schema `net` (postgres/service_role). Hoy la key vive solo en env vars de Vercel; esta superficie es nueva, chica pero real.

#### 4.4.4 System prompt y body en SQL

Función `construir_system_prompt_parseo(p_tienda_id uuid) returns text` — replica `construirSystemPrompt` (`parseoProducto.ts:81-128`) con `string_agg`:

- Marcas: `string_agg(distinct marca, ', ' order by marca)` de las bases de la tienda.
- Categorías + claves de atributos: CTE con la misma semántica replace-no-merge.
- Bases: `string_agg(format('- %s — %s%s', nombre, coalesce(marca, 'sin marca'), ...), e'\n' order by nombre, marca)`.
- **Requisito crítico para el prompt caching**: texto byte-idéntico entre requests → orden total determinístico (el índice único de la 0013 garantiza que no hay empates nombre+marca por tienda). Mismo requisito que hoy cumple `parseoProducto.ts:314-319`.

`encolar_llamada_llm(p_parseo_id uuid) returns bigint`: arma el body con `jsonb_build_object` — Anthropic: `model 'claude-haiku-4-5'`, `max_tokens`, `system` como array con `cache_control: {"type": "ephemeral"}`, `output_config` con el json_schema (constante jsonb en la función), `messages`; Gemini: `systemInstruction` + `responseMimeType: 'application/json'`. Llama:

```sql
net.http_post(
  url := v_url,
  headers := jsonb_build_object('x-api-key', v_key, ...),
  body := v_body,
  timeout_milliseconds := 20000   -- SIEMPRE explícito: el default de pg_net
                                  -- (5000ms en versiones actuales, 2000ms en
                                  -- previas) es insuficiente para un LLM.
)
```

El prompt vive en una función SQL → **cada iteración de prompt engineering es una migración** (riesgo §8.4). Mitigación opcional: tabla `prompts_parseo(nombre, plantilla)` editable sin migración, a costa de una pieza más.

#### 4.4.5 Validación de la respuesta

`validar_respuesta_parseo(p_raw jsonb, p_proveedor text) returns jsonb` (plpgsql) — el equivalente de `mapearRespuestaParseo` (`parseoProducto.ts:135`): extrae el texto (`content[0].text` en Anthropic / `candidates[0].content.parts` en Gemini), castea `::jsonb`, valida `nombreBase` string no vacío, `marca` string, `atributos` array de pares `{clave, valor}` string → objeto, `categoria` opcional; `stop_reason`/`finishReason` anómalos → error. Errores → `estado='error'` con detalle en `parseos.error`.

#### 4.4.6 Janitor pg_cron

Migración 0021: job cada 30s que (a) toma parseos `procesando` con respuesta de error ya llegada y nadie poleando → dispara fallback Gemini o marca `error`; (b) marca `timeout` los `pendiente`/`procesando` con `creado_at < now() - interval '45 seconds'`; (c) job diario que borra filas de `parseos` con más de 7 días (la tabla queda como ledger de rate limit y auditoría reciente).

### 4.5 Cambios en la capa de aplicación

| Pieza | Destino |
| --- | --- |
| `canonicalizarAtributos()` + lookup de defs (`crear-manual/route.ts:27-41`, `:89-100`) | **Se borra** — trigger 0017 |
| `sanitizarAtributos()` (`catalogo.ts:192-198`) | **Se borra** |
| `crearProductoManual()` (`catalogo.ts:205-280`) | Se reduce a `client.rpc("crear_producto_manual", {...})` + mapeo a DTO |
| `POST /api/productos/crear-manual` | Proxy fino: auth 401 → validación de shape → rpc → mapeo `"ya existe"`→409 |
| `POST /api/productos/parsear` + `src/services/parseoProducto.ts` completo | **Se eliminan** (mantener deployados sin uso durante una release como red de rollback, §7) |
| `ManualProductSheet.handleAnalizar` (`ManualProductSheet.tsx:103`) | `rpc("solicitar_parseo")` + poll de `obtener_parseo` (estado "analizando…" con `refetchInterval`) |
| `construirNombreCompleto` en el preview | Reemplazado por el `nombrePreview` que devuelve `obtener_parseo` |
| Rate limit Upstash para el parseo (`src/proxy.ts:46-68`) | Reemplazado por el guard en DB de `solicitar_parseo` (por usuario, no por IP) |
| Env vars `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` en Vercel | Migran a Vault (§4.4.3); se retiran de Vercel al final del rollout |

---

## Plan de migraciones

| # | Archivo | Contenido |
| --- | --- | --- |
| 0016 | `0016_extensiones_normalizacion.sql` | `unaccent` + `f_unaccent` + `forma_normalizada` (núcleo común) |
| 0017 | `0017_normalizacion_en_db.sql` | `sanear_atributos`, trigger `limpiar_atributos`, `marca_canonica`/`categoria_canonica`, `normalizar_marca_categoria` extendida, backfill (núcleo común) |
| 0018 | `0018_rpc_crear_producto_manual.sql` | `crear_producto_manual` + revoke/grant (núcleo común) |
| 0019 | `0019_parseos_infra.sql` | Extensiones `pg_net`/`pg_cron`, tabla `parseos` + RLS |
| 0020 | `0020_rpcs_parseo.sql` | `construir_system_prompt_parseo`, `encolar_llamada_llm`, `validar_respuesta_parseo`, `solicitar_parseo`, `obtener_parseo` + revoke/grant |
| 0021 | `0021_cron_janitor_parseos.sql` | Jobs pg_cron (fallback huérfano, timeouts, limpieza) |

**Qué NO va en migraciones**: los secretos de Vault (alta manual documentada en el runbook, §4.4.3).

---

## Plan de testing

**Unit (vitest, mocks)**: casos de `crearProductoManual` contra mock de `client.rpc` (idéntico al documento hermano). Los tests de `parseoProducto.test.ts` se retiran junto con el servicio; la lógica de poll de `ManualProductSheet` se testea con mock de `rpc` (estados pendiente→ok, pendiente→error, timeout).

**Integración (vitest contra Supabase real, patrón `src/tests/integration/aislamiento-rls.test.ts`)**:

1. Núcleo común: los 7 casos del documento hermano (saneo/canon de atributos con acentos, reutilización de base, canon de marca, EAN duplicado, atomicidad, aislamiento por tienda).
2. `parseos`: RLS (un usuario no ve parseos de otro ni de otra tienda), rate limit (la solicitud 16 en un minuto falla), guards de membresía y largo.
3. `solicitar_parseo`/`obtener_parseo` con el LLM **mockeado**: apuntar la URL del proveedor a un endpoint de prueba controlable (la URL sale de una tabla de config o del secreto en Vault del entorno de test) que devuelve respuestas canned: éxito, JSON inválido, status 500 (verifica fallback a Gemini), sin respuesta (verifica timeout vía janitor). **Sin llamadas reales al LLM en CI.**
4. `construir_system_prompt_parseo`: byte-idéntico entre dos llamadas consecutivas con el mismo catálogo (requisito del prompt caching).

---

## Rollout / Rollback

**Orden de deploy** (cada fase deja la app funcionando):

1. **Fase 1 — núcleo determinístico**: migraciones 0016–0018 (aditivas; la app actual sigue funcionando, su sanitización JS queda redundante e idempotente) → deploy de app con route adelgazada + rpc + bump del buster del query persister.
2. **Fase 2 — infra de parseo**: migraciones 0019–0021 + alta manual de secretos en Vault + **verificación en el proyecto real de la versión de pg_net y su timeout default** (§8.1). Nada de esto afecta a la app vigente.
3. **Fase 3 — switch del parseo**: deploy de `ManualProductSheet` con encolar+poll. La route `/api/productos/parsear` y `parseoProducto.ts` quedan deployados sin uso durante una release como red.
4. **Fase 4 — limpieza**: eliminar route/servicio viejos y las env vars de Vercel.

**Rollback**: Fase 3 revierte con deploy de app (la route vieja sigue ahí). 0019–0021 se revierten solas (drop de tabla/funciones/jobs) una vez revertida la app. 0018 exige revertir la app primero; 0016/0017 se revierten solas.

---

## Riesgos

> Sección obligatoria de esta spec: los trade-offs son el corazón de la decisión.

1. **pg_net está en beta.** `net._http_response` es interna y sin contrato de estabilidad; el timeout default es bajo para un LLM (5000ms actual, 2000ms en versiones previas) — **verificar la versión desplegada en implementación y setear `timeout_milliseconds` explícito (~20s) siempre**.
2. **UX estrictamente peor**: de síncrono (~1.5–4s) a encolar + poll (~2.5–6s), sin streaming posible. El usuario espera más para el mismo resultado.
3. **Observabilidad degradada**: se pierden los logs de Vercel, el SDK de Anthropic (retries, tipado de errores) y cualquier APM. Debug = SQL sobre `parseos`/`net._http_response`. Mitigación parcial: columna `parseos.debug` (status HTTP, latencia, tokens).
4. **Iteración de prompts = migraciones SQL** (o una tabla de plantillas: más piezas). Hoy un cambio de prompt es un commit de TypeScript.
5. **Lock-in a Supabase**: pg_net + Vault + pg_cron no son Postgres portable.
6. **Secretos visibles en el schema `net`** para roles privilegiados (§4.4.3): superficie nueva respecto de env vars en Vercel.
7. **Complejidad estructural**: una máquina de estados (5 estados, 2 proveedores, janitor) reemplaza ~250 líneas de TypeScript síncrono que funcionan. Es la trade-off central: se paga complejidad operativa por unificar la capa dueña de los datos.
8. Los riesgos del núcleo común aplican igual (documento hermano §Riesgos: colisión de claves post-trim, backfill cambia `nombre_completo` cacheado, acoplamiento por mensaje de error, performance del trigger).

---

## Preguntas abiertas

1. **Verificar en el proyecto Supabase real**: versión de pg_net desplegada, su `timeout_milliseconds` default y el TTL de limpieza de `net._http_response`; disponibilidad de Vault y pg_cron en el plan actual.
2. ¿Tabla `prompts_parseo` para iterar prompts sin migración, o se acepta el ciclo migración-por-prompt?
3. ¿Endurecer el índice único de bases con `f_unaccent`? (compartida con el documento hermano; requiere query de colisiones previa).
4. ¿Mantener un límite de gasto? El rate limit por usuario (15/min) acota, pero no hay tope global por tienda/día — evaluar contador agregado si el costo del LLM preocupa.
5. ¿Migrar el contrato de error a `errcode` custom (`P0409`) en route y RPCs?
