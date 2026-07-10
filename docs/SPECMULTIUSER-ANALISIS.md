# 🔍 Análisis crítico — Spec "Multi-usuario con equipos por tienda"

> **Objeto**: `SPECMULTIUSER.md` (propuesta aprobada para diseño, julio 2026).
> **Método**: cada afirmación de la spec sobre el código se verificó contra el árbol real del repo (commit `b3fc1da`, main al 2026-07-07). Todas las citas `archivo:línea` de este documento existen tal como se citan.
> **Estructura**: veredicto → fortalezas (qué preservar) → hallazgos priorizados por impacto (🔴 crítico / 🟠 alto / 🟡 medio), cada uno con su riesgo concreto y corrección específica → correcciones puntuales de exactitud → impacto en la estimación → limitaciones sin arreglo obvio.

---

## Veredicto general

La spec es **sólida en sus fundamentos**: los tres hallazgos del código que la condicionan (RPCs `SECURITY DEFINER`, singleton anon compartido browser/server, descarte del outbox ante errores no-de-red) son **correctos y literales**, las decisiones grandes (equipos por tienda, RLS con helpers, `@supabase/ssr`, roadmap incremental) están bien argumentadas, y el nivel de detalle en la capa de datos del cliente es inusualmente bueno para una spec.

Sus problemas son de dos tipos:

1. **Está desactualizada respecto de main**: se escribió contra un árbol anterior a los PRs #91–#93 (7 de julio). Eso produce el hallazgo crítico C1 (una quinta RPC `SECURITY DEFINER` que la spec no conoce), la colisión de numeración de migraciones (M1) y varios huecos en el inventario de "Estado actual".
2. **Tiene un punto ciego con el service worker custom** (C2) y tres razonamientos internos que, tal como están escritos, inducirían a error a quien implemente (C3, C4, A2).

Nada de esto invalida el diseño. Todos los hallazgos críticos tienen corrección concreta y barata; ninguno obliga a re-decidir las decisiones base.

---

## Fortalezas — qué preservar y por qué

Estas secciones están bien resueltas. El criterio común que las une —**verificar contra el código real y elegir la variante simple con el trade-off explícito**— es el que conviene replicar al corregir las secciones débiles.

1. **Los 3 hallazgos del resumen ejecutivo son exactos.** El descarte del outbox está donde la spec dice (`src/lib/outbox/outbox.ts:85-89`) y el diagnóstico es correcto por diseño: `isNetworkError` (`outbox.ts:48-53`) solo reconoce `navigator.onLine === false`, `TypeError` o mensajes con `/fetch|network/i` — un 401/`PGRST301` de PostgREST no matchea nada de eso y la operación se descarta con `writeQueue(resto)`. El fix propuesto (clasificar 401 como reintenable + `getSession()` antes de procesar) es el correcto y el más barato.
2. **La decisión "sin cambio" del índice parcial de `items_reposicion` (§1.3)** es el tipo de análisis que salva bugs: el índice `(variante_id) WHERE estado = 'pendiente'` (`0004:52-54`) es el target del `ON CONFLICT` de `agregar_item_reposicion` (`0006:43`), y como una variante pertenece a una sola tienda, ya es único por tienda. Cambiarlo rompería el merge atómico sin ganar nada. Correcto.
3. **El patrón RLS de §2.1** (helpers `SECURITY DEFINER` + `col IN (subquery)` evaluada como InitPlan, `auth.uid()` envuelto en `select`) es el patrón recomendado por Supabase, evita la recursión en las policies de `tienda_miembros` y unifica todo el enforcement. La alternativa de claims JWT se descarta con el argumento correcto (staleness de revocación).
4. **Deshabilitar signups públicos durante Fases 1–2 (§Roadmap)** cierra el agujero real del RLS intermedio (`authenticated` con `using (true)` + signup abierto = cualquiera ve producción). Es la mitigación más importante del roadmap y está bien secuenciada con su re-habilitación en Fase 3.
5. **La elección `@supabase/ssr`/cookies (§3.1)** está bien argumentada para esta PWA, incluida la duda offline: verificado que el arranque offline sirve el shell precacheado directamente desde el SW (`public/sw.js:224-254`) sin pasar por el Edge, y que lecturas/escrituras offline no tocan Supabase — el razonamiento "no importa que el access token expire offline" es correcto. `@supabase/ssr` efectivamente no está instalado hoy (la spec lo lista bien como dependencia nueva).
6. **Invitación por código vía RPC `SECURITY DEFINER` (§1.1)**: resuelve el huevo-y-gallina de RLS sin darle al empleado permiso de lectura sobre `tienda_invitaciones`, y evita depender de SMTP en el flujo crítico. Variante simple, trade-off explícito, mejora futura anotada.
7. **Los números citados del código son reales**: límites de rate limit 30/min y 15/min (`src/proxy.ts:44-62,92-101`), buster `v3` (`src/app/QueryProvider.tsx:38`), TTL 24h (`src/lib/queryPersister.ts:61`), CSP con `connect-src 'self' https://*.supabase.co` (`proxy.ts:243`) que efectivamente ya cubre Auth. La sección de Costos es verificable y honesta (el warning sobre el SMTP built-in de Supabase es pertinente).
8. **"Preguntas abiertas y decisiones diferidas"** difiere con criterio (catálogo semilla, selector multi-tienda, borrado de tiendas) en vez de inventar soluciones — exactamente lo que hay que hacer con lo que no tiene arreglo obvio todavía.

---

## 🔴 Hallazgos críticos

### C1. La spec omite una quinta RPC `SECURITY DEFINER` que filtraría datos entre tiendas

**Qué dice la spec.** "Las RPCs atómicas son `SECURITY DEFINER` (… — migraciones 0004–0007)" (resumen ejecutivo), "4 funciones atómicas `SECURITY DEFINER`" (Estado actual), y §1.5/§2.4 convierten exactamente esas 4 (+ `armar_nombre_completo`).

**Qué dice el código.** Existe una quinta: **`obtener_estadisticas_vencimiento(p_desde, p_hasta)`** — `supabase/migrations/0011_estadisticas_vencimiento.sql:10-46`, `security definer`, agrega sobre **todo** `items_vencimiento_historial` sin ningún filtro más que el rango de fechas, y devuelve `total_retirados`, `promedio_dias_a_retiro` y el top 10 de `producto_nombre`. La llama `src/services/vencimiento.ts:216` (hook `useEstadisticasVencimiento`). Entró a main el 7 de julio (PR #92), presumiblemente después de que se escribió la spec.

**Riesgo concreto.** Si la Fase 2 se implementa tal como está escrita, esta RPC queda como el único `SECURITY DEFINER` sobre datos de negocio: cualquier usuario autenticado de la tienda B vería estadísticas agregadas de **todas** las tiendas, incluidos nombres de productos de la tienda A (que con catálogo privado por tienda son datos comerciales). Es exactamente la clase de fuga que la suite de aislamiento de §2.4 debería atrapar — pero la suite, tal como está especificada ("las 4 RPCs"), no la testearía.

**Corrección.** En §1.5, sumarla a la lista de conversiones con este contenido:

```sql
-- 0014 (renumerada, ver M1): invoker + tienda explícita, mismo patrón que
-- guardar_lista_reposicion — la tienda activa viene del cliente y se valida
-- contra la membresía; RLS filtra igualmente como segunda capa.
create or replace function obtener_estadisticas_vencimiento(
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
    select producto_nombre,
           coalesce(cantidad, 1) as unidades,
           (fecha_retiro::date - fecha_vencimiento) as dias_a_retiro
    from items_vencimiento_historial
    where tienda_id = p_tienda_id
      and fecha_retiro >= p_desde
      and fecha_retiro <= p_hasta
  )
  select ... -- (cuerpo actual sin cambios)
$$;
```

Y tres arrastres que la spec debe registrar:

- `src/services/vencimiento.ts` pasa `p_tienda_id` (segunda firma que cambia en el cliente, no "la única" como dice §1.5 para `guardar_lista_reposicion`).
- El **fallback client-side** (`vencimiento.ts:234-238`, para `PGRST202`) también debe scopearse: post-Fase 2, RLS lo filtraría por *todas mis tiendas*, no por la activa — necesita `.eq("tienda_id", tiendaId)` o directamente eliminarse (la migración ya estará aplicada).
- §2.4: la suite de aislamiento verifica "las **5** RPCs", incluida esta con fechas amplias y dos tiendas con historial.

Actualizar los tres lugares donde la spec dice "4".

### C2. El service worker custom cachea datos de Supabase fuera del alcance del buster y del logout

**Qué dice la spec.** El aislamiento del cache local descansa en dos mecanismos: buster `v4:${userId}:${tiendaId}` para el cache de React Query en IDB (§4.2) y limpieza al logout de "el query cache de IDB, la cola del outbox y `gondolapp-recents`" (§3.2). El PWA solo aparece como "service worker viejo" (riesgo de versiones) y "update prompt" (Fase 4).

**Qué dice el código.** El SW real es un archivo custom mantenido a mano (`public/sw.js`; el `runtimeCaching` de `next.config.js:11-61` es letra muerta porque `sw: "sw.js"` lo reemplaza). Su handler `fetch` cachea en Cache Storage:

- **GETs a `/api/*`** en `API_CACHE` (`sw.js:96-98`) — post-Fase 2 eso incluye respuestas con datos de la tienda (p.ej. el GET deprecado de `crear-manual` devuelve marcas/categorías).
- **Todo otro GET, incluidos los de Supabase REST** (`*.supabase.co/rest/v1/...`), en `DYNAMIC_CACHE` vía el default network-first (`sw.js:119-121`). Es decir: los items de reposición, vencimientos e historial que hoy viajan por PostgREST **quedan copiados en Cache Storage**, un almacén que ni el buster de React Query ni la limpieza de §3.2 tocan.

**Riesgo concreto.** En el dispositivo compartido de la tienda (el caso que la propia spec declara como requisito de privacidad en §3.2): el usuario A cierra sesión, el usuario B —u otra tienda— abre la app, se corta la red, y el SW sirve desde `DYNAMIC_CACHE` respuestas de PostgREST con los datos de A. La fuga sortea RLS por completo porque nunca toca el servidor. El mismo mecanismo también puede servir datos de la tienda A tras cambiar a la tienda B.

**Corrección.** Dos cambios chicos, ambos en Fase 1 (no Fase 4):

1. En `public/sw.js`, excluir Supabase del SW — network-only, sin `respondWith`:

```js
// Nunca cachear Supabase (REST/Auth/Storage): el offline de datos lo maneja
// el persister de React Query en IDB, con buster por identidad.
if (url.hostname.endsWith(".supabase.co")) {
  return;
}
```

2. En el logout de §3.2, agregar un paso (4bis): purgar los caches dinámicos del SW —

```js
const keys = await caches.keys();
await Promise.all(
  keys
    .filter((k) => k.startsWith("gondolapp-dynamic-") || k.startsWith("gondolapp-api-"))
    .map((k) => caches.delete(k))
);
```

Con (1), (2) se vuelve casi redundante para Supabase pero sigue cubriendo `/api/*`. Además, la spec debería nombrar explícitamente que el SW es custom (`public/sw.js`) y que el `runtimeCaching` de `next.config.js` está inerte — quien implemente la Fase 4 ("update prompt del PWA") lo va a necesitar saber.

### C3. Contradicción interna: las PWAs anónimas rompen en Fase 1, no después de Fase 2

**Qué dice la spec.** La tabla de riesgos: "PWAs con service worker viejo **post-hardening** escriben como `anon` → 403 en todo", mitigado por "Secuenciar: deploy de Fase 1 (auth) **semanas antes** de Fase 2 (hardening RLS)". Pero el roadmap de Fase 1 dice: "**RLS intermedio**: se eliminan las policies de `anon`".

**Riesgo concreto.** Las dos afirmaciones no pueden ser ciertas a la vez. Si la migración de Fase 1 elimina las policies de `anon` (y es correcto que lo haga: es lo que hace verificable el "requests anónimas devuelven 0 filas/error" de la misma fase), entonces **toda PWA instalada que no haya pasado por `/login` rompe el día del deploy de Fase 1** — la ventana "semanas entre fases" no existe para el corte de anon. Quien implemente siguiendo la tabla de riesgos va a creer que tiene un colchón que no tiene, y el único usuario real de producción puede quedar bloqueado en el pasillo con la app instalada.

Hay una segunda imprecisión encadenada: §1.4 justifica mantener el `DEFAULT '<uuid>'` de `tienda_id` durante la Fase 1 por las "PWAs viejas … insertando sin `tienda_id`". Pero en Fase 1 **ningún** cliente envía `tienda_id` — el scoping del cliente y los triggers de derivación llegan en Fase 2. El `DEFAULT` sostiene a *todos* los clientes de la Fase 1, no a los viejos.

**Corrección.** Reescribir la fila de la tabla de riesgos:

> | **Corte de `anon` en la Fase 1 rompe toda PWA no logueada**: la migración de Fase 1 elimina las policies `anon`; cualquier instalación que no haya pasado por `/login` recibe 401/403 en todo, incluida la del usuario real | 🔴 Alta | El corte es parte del deploy de Fase 1 (no de Fase 2): coordinar login + recarga de la app con el usuario real el mismo día del deploy; adelantar el update prompt del PWA de Fase 4 a Fase 1; mensajes de error con CTA "recargar app" |

Y en §1.4, corregir el rationale del `DEFAULT`:

> El `DEFAULT` se mantiene durante toda la Fase 1 porque en esa fase **ningún cliente envía `tienda_id`** (el scoping del cliente y los triggers de derivación llegan en Fase 2); se elimina en la Fase 2, cuando los triggers lo reemplazan.

Con un solo usuario real, la coordinación de deploy-day es barata; lo que no es aceptable es que la spec prometa una ventana de gracia que la propia migración elimina.

### C4. El `WHERE tienda_id = p_tienda_id` de `guardar_lista_reposicion` es correctness, no "defensa en profundidad"

**Qué dice la spec.** §1.5: "Todos los `from items_reposicion` ganan `where tienda_id = p_tienda_id` (**defensa en profundidad; RLS ya filtra**), … y el `delete from items_reposicion where id is not null` pasa a `where tienda_id = p_tienda_id`".

**Qué dice el código.** La versión vigente de la RPC borra la tabla entera al cerrar la lista: `delete from items_reposicion where id is not null` (`0005:59`).

**Riesgo concreto.** El paréntesis es falso y peligroso: como invoker, RLS filtra por **todas las tiendas del usuario**, no por la tienda activa. La propia spec modela usuarios con múltiples membresías (`mis_tiendas()` devuelve un set; §3.2 contempla selector de tienda). Para un usuario en las tiendas A y B, un `delete … using (tienda_id in mis_tiendas())` sin el `WHERE` explícito **archivaría y vaciaría también la lista pendiente de B** al guardar la de A — pérdida de trabajo de otro equipo, silenciosa y difícil de reconstruir. El WHERE es la única línea que lo impide. Etiquetarlo "defensa en profundidad" invita a que un refactor futuro lo borre por redundante.

**Corrección.** Reescribir el paréntesis:

> Todos los `from items_reposicion` ganan `where tienda_id = p_tienda_id` (**imprescindible, no redundante**: RLS como invoker filtra por *todas* las tiendas del usuario, no por la activa; sin este WHERE, un usuario con dos membresías que guarda la lista de A archivaría y vaciaría también los items pendientes de B), …

Y agregar a §2.4 un caso de test específico: *usuario miembro de A y B, items pendientes en ambas, `guardar_lista_reposicion(A)` no toca los de B*. Hoy la suite descrita (usuarios disjuntos, 2×2) no cubriría este bug: el escenario multi-membresía es un tercer eje que falta en la matriz.

---

## 🟠 Hallazgos altos

### A1. El trigger de derivación condicional permite items cross-tienda

**Qué dice la spec.** §1.2: el trigger deriva `tienda_id` **solo si viene NULL** (`if new.tienda_id is null then …`), y "El `WITH CHECK` de RLS valida igualmente el valor derivado — no es un bypass".

**Riesgo concreto.** El `WITH CHECK` valida *membresía* (`tienda_id in mis_tiendas()`), no *consistencia*. Un usuario miembro de A y B puede insertar `items_reposicion` con `tienda_id = B` y `variante_id` de A: ambas pasan sus checks y queda un item cuya tienda no es la de su variante. Consecuencias: el item es invisible para los índices/policies "correctos", los joins del historial mezclan tiendas, y el índice parcial de pendientes (que es por variante) deja de garantizar "un pendiente por tienda". No hace falta malicia — alcanza un bug de cliente con `tiendaActivaId` stale.

**Corrección.** Hacer la derivación **incondicional e ignorar el valor del cliente** (la tienda del item *es* la de la variante, siempre):

```sql
create or replace function set_tienda_id_desde_variante() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Incondicional: ignora cualquier tienda_id enviado por el cliente.
  -- Como invoker, este select está sujeto a RLS: si la variante no es de
  -- una tienda del usuario, devuelve NULL y el insert falla acá.
  select tienda_id into new.tienda_id
    from producto_variantes where id = new.variante_id;
  if new.tienda_id is null then
    raise exception 'variante inexistente o fuera de tus tiendas: %', new.variante_id;
  end if;
  return new;
end; $$;
```

Mismo criterio para las otras derivaciones (variante→base, item_historial→lista). Esto además simplifica el contrato del cliente: `tienda_id` explícito queda **solo** para `producto_bases` y `categoria_atributos`. Alternativa más pesada (FK compuesta `(variante_id, tienda_id)` con `unique (id, tienda_id)` en `producto_variantes`) da la misma garantía a nivel declarativo; el trigger incondicional alcanza y no agrega índices.

### A2. "Mantener límite por IP en /login/registro" no protege nada

**Qué dice la spec.** §5: "Mantener límite por IP en `/login`/`/registro` (anti fuerza bruta; Supabase Auth trae los suyos, esto es capa extra barata)".

**Qué dice el código.** El proxy solo aplica rate limiting a rutas `/api/*` (`src/proxy.ts:73`: `if (!pathname.startsWith("/api/")) return addSecurityHeaders(...)`). Y con `@supabase/ssr`, los POST de credenciales (`signInWithPassword`, `signUp`) van del navegador **directo a `*.supabase.co/auth/v1/*`** — nunca pasan por Vercel ni por el proxy.

**Riesgo concreto.** Bajo en daño directo (Supabase Auth tiene sus propios límites) pero alto en confusión: la spec promete una capa de defensa que, tal como está el tráfico, es imposible de implementar en el proxy. Quien lo intente va a limitar el GET de la *página* de login, que es inútil, y puede dar por cubierto el riesgo de fuerza bruta.

**Corrección.** Eliminar la afirmación y reemplazarla por:

> Los intentos de login/signup van del navegador directo a Supabase Auth y no atraviesan el proxy (que además solo limita `/api/*`). La protección anti fuerza bruta es el rate limiting propio de Supabase Auth (dashboard → Auth → Rate limits) y, si apareciera abuso, el CAPTCHA integrado de Auth. El proxy no aporta nada acá y no debe intentarlo.

### A3. La suite de aislamiento RLS —el gate de la Fase 2— no tiene harness definido

**Qué dice la spec.** §2.4 y la tabla de riesgos la declaran "obligatoria antes de cerrar la Fase 2" (2 usuarios × 2 tiendas, por tabla × operación, más las RPCs). Es la mitigación del riesgo #1 del proyecto.

**Qué dice el código.** Los 18 archivos de test existentes son **unit tests con Supabase mockeado** (`src/tests/mocks/supabaseMock.ts`; `catalogo.test.ts:6-8` hace `vi.mock("@/lib/supabase")`). No existe ni un test de integración contra un Postgres real, ni configuración para tenerlo. `vitest.config.ts` corre todo en jsdom.

**Riesgo concreto.** La verificación más importante del proyecto no tiene definido contra qué corre, cómo se crean los dos usuarios con JWTs reales, ni cómo se resetea el estado entre tests. Sin decidirlo en la spec, o se improvisa a mitad de la Fase 2 (la fase ya marcada como "la más riesgosa"), o se degrada a un checklist manual — que es exactamente lo que una policy olvidada necesita para llegar a producción.

**Corrección.** Agregar a §2.4 (y a la Fase 0 como preparación) la definición del harness:

- **Stack**: `supabase start` local (el CLI ya es la herramienta de migraciones del repo) o el branch de staging de la Fase 0. Proyecto vitest separado (`vitest.integration.config.ts`, environment `node`, sin mocks), excluido del run default y del coverage.
- **Fixtures**: los dos usuarios se crean vía Admin API con la `service_role` key local (`auth.admin.createUser`), se obtienen JWTs reales con `signInWithPassword` contra la anon key, y cada test corre con dos clientes `createClient(url, anonKey, { global: { headers: { Authorization } } })`.
- **Matriz**: por tabla × operación (A no lee/escribe/borra B), las 5 RPCs con ids ajenos (ver C1), y el caso multi-membresía de C4.
- **Presupuesto**: +1–2 días sobre la estimación (ver §Estimación).

### A4. Las RPCs nuevas `SECURITY DEFINER` tienen guards sin especificar y una race

Tres huecos en §1.5, todos con el mismo patrón: como `SECURITY DEFINER` bypasea RLS, **cada guard que la policy ya no aplica debe estar escrito dentro de la función** — y la spec no los escribe.

1. **`generar_codigo_invitacion` no declara el check de admin.** La spec dice que la RPC "evita duplicar la lógica del alfabeto", pero como DEFINER también evita la policy de admin sobre `tienda_invitaciones`: sin guard interno, cualquier empleado (o cualquier autenticado) generaría códigos de invitación de cualquier tienda — escalada directa a admin vía invitación con `p_rol = 'admin'`. Especificar la primera línea:

   ```sql
   if p_tienda_id not in (select mis_tiendas_admin()) then
     raise exception 'Solo un admin de la tienda puede generar invitaciones';
   end if;
   ```

2. **`canjear_invitacion` tiene una race check-then-act.** "Valida (`usos < max_usos`) … incrementa `usos`" como pasos separados permite que dos canjes concurrentes del mismo código de 1 uso entren ambos. Especificar el canje como UPDATE atómico (el UPDATE toma row lock; el segundo canje ve `usos` ya incrementado y no matchea):

   ```sql
   if auth.uid() is null then raise exception 'requiere sesión'; end if;

   -- Si ya es miembro, no quemar un uso del código.
   select tienda_id into v_tienda_id from tienda_invitaciones where codigo = p_codigo;
   if exists (select 1 from tienda_miembros
              where tienda_id = v_tienda_id and user_id = auth.uid()) then
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
   values (v_tienda_id, auth.uid(), v_rol)
   on conflict do nothing;
   return v_tienda_id;
   ```

   (El `on conflict do nothing` de la spec era correcto pero insuficiente: sin el early-return, un re-canje idempotente quemaba un uso igual.)

3. **El `REVOKE ... FROM anon` solo está especificado para las RPCs existentes.** Verificado: no hay un solo `GRANT`/`REVOKE` en todo `supabase/` — las funciones nuevas nacen con EXECUTE por defecto para `anon` y `authenticated` (default de Supabase en el schema `public`). `crear_tienda_con_admin`, `canjear_invitacion` y `generar_codigo_invitacion` necesitan su propio `revoke execute … from anon` en la misma migración que las crea (los guards de `auth.uid()` las vuelven inofensivas para anon, pero dejarlas invocables es superficie gratuita). Los helpers `mis_tiendas()`/`mis_tiendas_admin()` pueden quedar: con `auth.uid()` NULL devuelven set vacío.

---

## 🟡 Hallazgos medios

### M1. Colisión de numeración de migraciones y "Estado actual" desactualizado

Ya existe `supabase/migrations/0011_estadisticas_vencimiento.sql`; las migraciones propuestas `0011`–`0014` deben ser **`0012`–`0015`**. Es el síntoma de un problema más general: la spec se escribió contra un árbol anterior a los PRs #91–#93 (2026-07-07) y su inventario de "Estado actual" omite tres piezas que sus propias secciones tocan:

- El store persistido **`notificaciones`** (`src/store/notificaciones.ts`, key `gondolapp-notificaciones`) — falta en la fila "Estado UI" y en §4.4.
- La lib de **notificaciones locales de vencimientos** (`src/lib/notificacionesVencimiento.ts`, localStorage `gondolapp-vencimientos-notificados`) — relevante para el logout (M2) y para multi-tienda (el set de "ya notificado" debería ser por tienda).
- El **catálogo offline-first** (`useCatalogoCompleto` + `src/lib/catalogoLocal.ts` + `CatalogoSyncProvider`): búsqueda y escaneo offline corren sobre la query `["catalogo","completo"]` persistida. No requiere trabajo extra (el buster de §4.2 lo cubre), pero la spec debería decirlo — es la confirmación de que el buster por identidad es suficiente también para el catálogo.

**Corrección**: renumerar, y agregar a la cabecera de la spec el commit de main contra el que está escrita, con la regla de re-verificar el inventario antes de arrancar cada fase.

### M2. La limpieza de logout de §3.2 es incompleta

A los tres pasos actuales (query cache IDB, cola outbox, `gondolapp-recents`) les faltan: los caches del SW (`gondolapp-dynamic-*`/`gondolapp-api-*`, ver C2), el localStorage `gondolapp-vencimientos-notificados`, y la cancelación de las notificaciones locales programadas. `gondolapp-ui`/`gondolapp-theme` pueden quedar (preferencias de dispositivo, sin datos). Conviene reescribir §3.2 como una función única `limpiarEstadoLocal()` con la lista completa, reutilizada por logout y por el caso "cambio de usuario detectado".

### M3. §4.1 apunta a los archivos equivocados para las query keys

`useMarcasCategorias.ts` **no tiene query key propia** (deriva del catálogo en memoria con `useMemo`). Las ubicaciones reales: keys privadas en `useReposicion.tsx:12-14` y `useVencimiento.tsx:11-13`, `CATALOGO_COMPLETO_KEY` exportada en `useCatalogoCompleto.ts:6` (reusada en `ScanFlow.tsx`, `CatalogoSyncProvider.tsx`, `useScanProduct.ts`) y la factory `eanQueryKey` en `useScanProduct.ts:44-46`. Las 4 familias persistidas por `esQueryPersistible` (`queryPersister.ts:52-59`) incluyen `["catalogo","completo"]` y `["producto","ean"]` — el namespacing por tienda debe cubrirlas a ellas y a las keys de historial/estadísticas, no solo a reposición/vencimiento. También hay que actualizar la invalidación por prefijo de `OutboxProvider.tsx:25-26` a la forma `["tienda", tiendaId, …]`.

### M4. Fragilidad preexistente del remap de tempIds, amplificada por el fix del 401

El `idMap` de remap es **por corrida** (`outbox.ts:73`, local a `processQueue`): si una creación se sincroniza y la app se recarga antes de que sus updates dependientes salgan de la cola, esos updates quedan con `offline:UUID` sin resolver y se descartan como error de datos. Es un bug preexistente y ortogonal al multi-usuario, pero el fix del 401 (cortar la corrida y reintentar más tarde) **aumenta la frecuencia de corridas partidas**, que es exactamente el escenario que lo dispara. La spec debería nombrarlo como riesgo conocido en §4.3; el fix real (persistir el mapping tempId→realId junto a la cola, o reescribir los ids en las operaciones encoladas al sincronizar la creación) es diferible pero conviene decidirlo antes de la Fase 2, porque toca el mismo archivo que el fix del 401.

### M5. La inyección de `client` no termina en `catalogo.ts`

§5 inyecta `client` en 3 funciones de `catalogo.ts`, pero `src/services/parseoProducto.ts` también llama a `obtenerDefinicionesAtributos` server-side — `parsearProducto` necesita recibir y propagar el client (o las definiciones ya resueltas). Además `catalogo.ts` exporta **9** funciones, no 3; la spec debería listar explícitamente cuáles quedan browser-only (`buscarPorCodigoBarras`, `buscarVariantes`, `obtenerCatalogoCompleto`, etc.) para que el refactor de Fase 0 tenga un alcance cerrado.

### M6. Doble estándar no declarado: la revocación instantánea convive con cache offline indefinido

§2.1 descarta los claims JWT porque una revocación que tarda hasta 1 hora es "inaceptable para el caso 'empleado despedido con el teléfono en el bolsillo'". Pero la arquitectura elegida le da a ese mismo empleado **acceso indefinido a la última copia local** (cache IDB de React Query + `tiendaActivaId` persistido) mientras no se conecte: el gate client-side "nunca bloquea el shell offline si hay sesión local" (§Riesgos). No hay arreglo obvio dentro de un diseño offline-first y **no** proponemos inventar uno; lo que falta es declararlo: la revocación server-side es inmediata (primer request online falla), la copia local ya descargada no es revocable remotamente. Si algún día importa, las opciones conocidas (TTL corto del cache persistido, wipe remoto vía push) tienen costos de UX que hoy no se justifican. Dejarlo escrito evita que se venda "expulsión instantánea" como garantía.

### M7. El drop de policies `anon` debe tocar dos migraciones, no una

§2.2 dice "Se eliminan todas las policies `allow_all_anon`" citando la 0002, pero `0002_enable_rls.sql` cubre **7** tablas; la octava (`categoria_atributos`) recibe su propia `allow_all_anon` en `0008:73-75`. Detalle chico con modo de falla real: un `drop policy` guiado por la 0002 deja `categoria_atributos` abierta a `anon` — y es justamente la tabla que leen los API routes. Especificar el drop por enumeración de las 8 tablas.

---

## Correcciones puntuales de exactitud

Menores, sin riesgo estructural, para pulir al re-editar:

| Dónde | Dice | Debe decir |
| --- | --- | --- |
| Resumen ejecutivo, Estado actual, §2.4 | "4 RPCs `SECURITY DEFINER` (0004–0007)" | 5, incluyendo `obtener_estadisticas_vencimiento` (0011) — ver C1 |
| §1.5 | `guardar_lista_reposicion` es "la única firma que cambia en el cliente" | una de dos: también cambia `obtener_estadisticas_vencimiento` (C1) |
| Estado actual | RLS permisivo "(0002)" | 0002 (7 tablas) + 0008:73-75 (`categoria_atributos`) — ver M7 |
| Estado actual, "Estado UI" | "Zustand: `ui`, `recents`, `theme`, `feedback`, `outbox`" | + `notificaciones` (persistido) — ver M1 |
| §4.1 | keys en "`useReposicion.tsx`, `useVencimiento.tsx`, `useMarcasCategorias.ts`" | `useReposicion.tsx`, `useVencimiento.tsx`, `useCatalogoCompleto.ts`, `useScanProduct.ts` — ver M3 |
| Roadmap Fase 1/2 | migraciones `0011`–`0014` | `0012`–`0015` — ver M1 |
| §Riesgos / §5 | "límite por IP en `/login`/`/registro`" | eliminar — ver A2 |

---

## Impacto en la estimación

La estimación de ~15–25 días **sigue siendo plausible**: ninguno de los hallazgos agranda el diseño, y varios (C4, A1, A4) son texto/SQL que igual había que escribir. Dos ajustes:

- **+1–2 días** en Fase 0/2 por el harness de integración de A3, que hoy no existe y la spec asumía implícitamente.
- **Mover ~medio día de Fase 4 a Fase 1**: la exclusión de Supabase en el SW y el update prompt básico (C2, C3) no pueden esperar al final.

Total ajustado: **~16–27 días**, misma banda de 4–7 semanas a tiempo parcial.

## Lo que no tiene arreglo obvio (y está bien que no lo tenga)

- **Revocación de acceso al cache local ya descargado** (M6): inherente a offline-first; declararlo como limitación aceptada.
- **Arranque en frío del catálogo por tienda**: la spec ya lo difiere honestamente (catálogo semilla como mejora futura). Mantenerlo así.
- **Remap de tempIds entre corridas** (M4): tiene fix conocido pero no trivial; decidir en Fase 2 si se paga o se documenta como edge case.
