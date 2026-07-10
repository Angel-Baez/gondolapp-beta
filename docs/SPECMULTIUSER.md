# 👥 Spec: Multi-usuario con equipos por tienda — GondolApp (v2)

> **Estado**: Propuesta aprobada para diseño. No implementado.
> **Fecha**: julio 2026 (v2).
> **Verificada contra**: main `b3fc1da` (2026-07-07). Cada afirmación sobre el código de este documento fue contrastada contra ese árbol; las citas `archivo:línea` existen tal como se citan. **Regla operativa**: re-verificar el inventario de "Estado actual" contra main antes de arrancar cada fase — la v1 de esta spec quedó desactualizada por tres PRs en una semana.
> **Reemplaza a**: la v1 de `SPECMULTIUSER.md`. Los cambios respecto de la v1 y su justificación están en [`SPECMULTIUSER-ANALISIS.md`](./SPECMULTIUSER-ANALISIS.md).
> **Decisiones base**: equipos por tienda · Supabase Auth (email + contraseña) · catálogo privado por tienda · roadmap por fases.

## Índice

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Estado actual](#estado-actual)
3. [Evaluación: alternativas, ventajas y desventajas](#evaluación-alternativas-ventajas-y-desventajas)
4. [Riesgos](#riesgos)
5. [Costos](#costos)
6. [Diseño técnico](#diseño-técnico)
7. [Roadmap por fases](#roadmap-por-fases)
8. [Preguntas abiertas, decisiones diferidas y limitaciones declaradas](#preguntas-abiertas-decisiones-diferidas-y-limitaciones-declaradas)

---

## Resumen ejecutivo

GondolApp es hoy **single-user/single-device por diseño**: el navegador accede a Supabase directamente con la anon key y las políticas RLS son permisivas (`USING (true)`). Este spec diseña la conversión a **multi-usuario con equipos por tienda**: organizaciones ("tiendas") con miembros, roles `admin`/`empleado` e invitaciones por código, donde los miembros comparten la lista de reposición, los vencimientos, el historial y el catálogo de productos. El catálogo es **privado por tienda** (el mismo código de barras puede existir en dos tiendas).

**Esfuerzo estimado**: ~16–27 días efectivos de desarrollo (4–7 semanas a tiempo parcial), repartidos en 5 fases donde cada fase deja la app funcionando en producción.

Cuatro hallazgos del código actual condicionan todo el proyecto (detalle en [Diseño técnico](#diseño-técnico)):

1. **Las RPCs atómicas son `SECURITY DEFINER` — y son cinco, no cuatro**: `agregar_item_reposicion`, `guardar_lista_reposicion`, `retirar_item_vencimiento`, `retirar_items_vencimiento` (migraciones 0004–0007) **y `obtener_estadisticas_vencimiento` (0011)**, que agrega sobre todo el historial de vencimientos sin filtro alguno. Con RLS por tienda, las cinco bypasearían las policies: hay que reescribirlas como `SECURITY INVOKER`. No alcanza con "agregar policies".
2. **Los API routes usan el cliente browser con anon key en el servidor**: `/api/productos/crear-manual` y `/api/productos/parsear` importan `src/services/catalogo.ts` (directamente y vía `src/services/parseoProducto.ts`), que usa el singleton de `src/lib/supabase.ts`. Al endurecer RLS (quitar `anon`), estos routes se rompen si no se les inyecta un cliente autenticado por request.
3. **El outbox descarta operaciones ante cualquier error no-de-red** (`src/lib/outbox/outbox.ts:85-89`; `isNetworkError` en `:48-53` solo reconoce offline, `TypeError` o mensajes `/fetch|network/i`). Un 401 por JWT expirado al volver online **perdería silenciosamente todo el trabajo offline del usuario**. Es el bug más caro de todo el proyecto si se omite el fix.
4. **El service worker custom cachea respuestas de Supabase en Cache Storage**: `public/sw.js` (el `runtimeCaching` de `next.config.js` es letra muerta — `sw: "sw.js"` lo reemplaza) cachea por default todo GET, incluidos los de PostgREST, en `DYNAMIC_CACHE` (`sw.js:119-121`) y los de `/api/*` en `API_CACHE` (`sw.js:96-98`). Es un almacén de datos de tienda que ningún mecanismo de aislamiento por identidad alcanza si no se lo trata explícitamente (§6).

---

## Estado actual

Arquitectura single-user relevante para este spec:

| Aspecto | Hoy |
| --- | --- |
| Autenticación | ❌ No existe. Sin login, sesiones ni usuarios |
| Acceso a datos | Browser → Supabase directo con `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`src/lib/supabase.ts`) |
| RLS | Habilitado en las 8 tablas, con policies `allow_all_anon` `USING (true)` para `anon, authenticated`: 7 tablas en `supabase/migrations/0002_enable_rls.sql` y `categoria_atributos` en `0008:73-75` |
| Tenancy | ❌ Ninguna tabla tiene `user_id` ni `tenant_id` |
| RPCs | **5** funciones `SECURITY DEFINER`: las 4 atómicas (migraciones 0004–0007) + `obtener_estadisticas_vencimiento` (0011). Sin ningún `GRANT`/`REVOKE` en todo `supabase/` (EXECUTE default para `anon`/`authenticated`) |
| Offline (datos) | Cache de React Query persistido en IndexedDB (`src/lib/queryPersister.ts`; buster `v3` en `src/app/QueryProvider.tsx:38`, TTL 24h) + outbox pattern con tempIds `offline:UUID` (`src/lib/outbox/`) |
| Offline (catálogo) | Catálogo offline-first: la query `["catalogo","completo"]` (`useCatalogoCompleto.ts`) persiste el catálogo entero; búsqueda y escaneo offline corren sobre él con `src/lib/catalogoLocal.ts` (funciones puras en memoria, sin store propio) |
| PWA / Service worker | **SW custom mantenido a mano** (`public/sw.js`, next-pwa solo lo registra; su `runtimeCaching` está inerte). Precachea el shell y cachea GETs de `/api/*` y de Supabase en Cache Storage. El arranque offline sirve el shell sin pasar por el Edge |
| API routes | `/api/productos/crear-manual` y `/api/productos/parsear` (IA: Anthropic + fallback Gemini), sin verificación de identidad |
| Rate limiting | Por IP con Upstash Redis en `src/proxy.ts`, **solo sobre `/api/*`** (`proxy.ts:73`): 30/min general, 15/min en parsear y crear-manual |
| Estado UI | Zustand: `ui`, `recents`, `theme`, `notificaciones` (persistidos), `feedback`, `outbox` (efímeros). Además localStorage suelto: `gondolapp-vencimientos-notificados` (`src/lib/notificacionesVencimiento.ts`) |

Tablas existentes (todas reciben `tienda_id`, ver §Schema): `producto_bases`, `producto_variantes`, `categoria_atributos`, `items_reposicion`, `listas_reposicion_historial`, `items_reposicion_historial`, `items_vencimiento`, `items_vencimiento_historial`.

---

## Evaluación: alternativas, ventajas y desventajas

### Opción elegida — Organizaciones "tienda" con miembros y roles

**Ventajas**

- Modela la realidad del negocio: el equipo de una tienda comparte las listas y el catálogo; varios repositores trabajan sobre la misma lista de reposición.
- Escalable a N tiendas sin re-arquitectura: sumar un segundo cliente es crear otra tienda, no otro proyecto.
- El catálogo privado por tienda evita el problema de calidad de datos compartidos (EANs reutilizados entre negocios distintos, nombres/marcas corrompidos por terceros).
- Base natural para features de equipo futuros: auditoría ("quién repuso qué"), presence, notificaciones.

**Desventajas**

- Es la opción más cara: 3 tablas nuevas, RLS real por tienda, sistema de invitaciones, matriz de roles y ~6 pantallas nuevas.
- Cada tienda arranca con catálogo vacío (sin efecto red). Mitigable a futuro con un catálogo semilla global de solo lectura.

### Alternativa A — Una sola tienda multi-usuario (descartada)

Solo agregar auth y policies `TO authenticated`, sin `tienda_id`. Cuesta ~40% del esfuerzo (equivale a Fases 0–1 de este spec). Suficiente **solo si nunca habrá una segunda tienda**; en cuanto aparezca, obliga a hacer exactamente esta migración pero con más datos y más usuarios en producción. Descartada porque la ambición declarada es multi-tienda.

### Alternativa B — Datos privados por usuario (descartada)

`user_id` en vez de `tienda_id`: RLS trivial, sin tablas de membresía. Pero rompe el caso de uso central — dos empleados de la misma tienda no verían la misma lista de reposición. Descartada de plano.

---

## Riesgos

| Riesgo | Severidad | Mitigación |
| --- | --- | --- |
| **Fuga de datos entre tiendas** por policy mal escrita/olvidada, o RPC `SECURITY DEFINER` que bypasea RLS | 🔴 Alta | Suite de tests de aislamiento (2 usuarios × 2 tiendas + caso multi-membresía, por tabla × operación) obligatoria antes de cerrar la Fase 2, con el harness definido en §2.4; convertir las **5** RPCs a `SECURITY INVOKER` (RLS como único punto de enforcement); correr el linter de seguridad de Supabase (`get_advisors`) tras cada migración |
| **Fuga de datos vía Cache Storage del SW**: `public/sw.js` cachea GETs de Supabase y `/api/*`; en un dispositivo compartido, el usuario B (u otra tienda) puede recibir offline respuestas cacheadas del usuario A, sorteando RLS por completo | 🔴 Alta | En Fase 1 (§6): excluir `*.supabase.co` del SW (network-only; el offline de datos ya lo cubre el persister de React Query) + purgar `gondolapp-dynamic-*`/`gondolapp-api-*` en `limpiarEstadoLocal()` |
| **Pérdida silenciosa del outbox por JWT expirado**: hoy `processQueue` descarta operaciones ante cualquier error no-de-red (`outbox.ts:85-89`) | 🔴 Alta | Clasificar 401/`PGRST301`/JWT expired como errores **reintenables** (cortan la corrida como los de red, no descartan); refrescar sesión (`getSession()`) antes de procesar la cola; test unitario específico en `outbox.test.ts`. Riesgo conocido adyacente: el remap de tempIds es por-corrida (§4.3) y el fix del 401 aumenta las corridas partidas — decidir en Fase 2 si se paga su fix |
| **La migración de producción rompe la tienda activa**: backfill incompleto, constraint nueva que choca con datos | 🔴 Alta | Ensayo completo en branch/staging de Supabase con dump de producción; migraciones transaccionales; `DEFAULT '<uuid-tienda-inicial>'` durante la ventana de transición (Fase 1 → Fase 2); backup previo verificado |
| **Corte de `anon` en la Fase 1 rompe toda PWA no logueada**: la migración de Fase 1 elimina las policies `anon`; cualquier instalación que no haya pasado por `/login` recibe 401/403 en todo, incluida la del usuario real | 🔴 Alta | El corte es **parte del deploy de Fase 1**, no de Fase 2: coordinar login + recarga de la app con el único usuario real el mismo día del deploy; adelantar el update prompt del PWA a Fase 1; mensajes de error claros con CTA "recargar app" |
| **Degradación de UX**: la app que "simplemente funcionaba" ahora exige login; una sesión caída en el pasillo bloquea el trabajo | 🟠 Media-Alta | Config de Auth sin time-box ni inactivity timeout; la arquitectura offline queda intacta (lecturas desde IDB y escrituras al outbox **no requieren JWT vigente**); el gate client-side nunca bloquea el shell offline si hay sesión local |
| **Superficie de testing multiplicada** (auth × roles × offline × tiendas) | 🟡 Media | Suite de aislamiento RLS separada de los tests de unidad (harness en §2.4); congelar feature work durante Fases 1–2; los tests actuales siguen válidos porque los servicios casi no cambian de firma |
| **Costo de mantenimiento para dev solo** (auth, emails, gestión de miembros = superficie operativa nueva) | 🟡 Media | Elegir la variante simple en cada trade-off: invitación por código (no email), sin confirmación de email inicial, sin selector multi-tienda completo; runbook operativo en `docs/` |
| **Route handlers rotos por el refactor de inyección de cliente** | 🟡 Media | Hacer el refactor de firma (`client` param con default) en Fase 0, sin cambio de comportamiento, mucho antes del hardening |

---

## Costos

### Infraestructura

| Servicio | Impacto | Costo |
| --- | --- | --- |
| **Supabase Auth** | Free tier incluye 50.000 MAU (Pro: 100.000) — órdenes de magnitud por encima de la necesidad | $0 |
| **Emails transaccionales** | ⚠️ El SMTP built-in de Supabase es **solo para testing** (~2-4 emails/hora y solo a miembros del proyecto) — inviable para reset de contraseña de usuarios reales. Configurar **Resend free tier** (3.000/mes, 100/día) como SMTP custom con el dominio `gondolapp.digital`. Alternativa: Brevo (300/día). El volumen real esperado es casi nulo (solo recovery) | $0 |
| **Vercel** | Mismo tráfico; pantallas nuevas son estáticas | $0 extra |
| **Upstash Redis** | El rate limiting cambia de clave (usuario en vez de IP) pero no de volumen; el gate de sesión en el proxy lee cookie, no llama a Redis | $0 extra |
| **Anthropic/Gemini (IA)** | Sin cambio; de hecho el gate 401 en `/api/productos/parsear` **reduce** el riesgo de gasto por abuso anónimo | $0 extra |

### Tiempo de desarrollo (dev solo, días efectivos)

| Fase | Alcance | Estimación |
| --- | --- | --- |
| 0 — Preparación | Refactors sin cambio de comportamiento + staging + **harness de tests de integración** | 2–4 días |
| 1 — Auth + tienda única implícita | Auth end-to-end, pantallas, migración inicial, gate, **cambios de SW** | 4–7 días |
| 2 — Scoping real (la más riesgosa) | RLS por tienda, constraints, RPCs, cliente scoped, suite de aislamiento | 5–8 días |
| 3 — Invitaciones y equipo | Onboarding, roles, gestión de miembros | 3–5 días |
| 4 — Colaboración en vivo y polish | Refetch/realtime, runbook | 2–3 días |
| **Total** | | **~16–27 días** (4–7 semanas a tiempo parcial) |

---

## Diseño técnico

### 1. Schema

#### 1.1 Tablas nuevas

```sql
create table tiendas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) between 1 and 80),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()   -- reutiliza trigger set_updated_at
);

create table tienda_miembros (
  tienda_id uuid not null references tiendas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rol text not null default 'empleado' check (rol in ('admin', 'empleado')),
  created_at timestamptz not null default now(),
  primary key (tienda_id, user_id)
);
create index idx_tienda_miembros_user_id on tienda_miembros (user_id);

create table tienda_invitaciones (
  id uuid primary key default gen_random_uuid(),
  tienda_id uuid not null references tiendas(id) on delete cascade,
  codigo text not null unique,            -- 8 chars alfanuméricos sin ambiguos (sin 0/O/1/I)
  rol text not null default 'empleado' check (rol in ('admin', 'empleado')),
  creado_por uuid references auth.users(id) on delete set null,
  expira_at timestamptz not null default now() + interval '7 days',
  max_usos int not null default 1 check (max_usos > 0),
  usos int not null default 0,
  revocada boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_tienda_invitaciones_tienda_id on tienda_invitaciones (tienda_id);
```

**Invitación por código, no por email.** Razones: (a) el flujo crítico no depende de infraestructura de envío de emails; (b) el caso de uso real es un encargado mostrando/dictando un código a un empleado en el pasillo, no un flujo corporativo; (c) el código se canjea vía RPC `SECURITY DEFINER`, así el empleado nunca necesita permiso de lectura sobre `tienda_invitaciones`. El código se comparte también como link (`/unirse?codigo=X`). Invitación por email queda como mejora futura.

#### 1.2 `tienda_id` en las tablas existentes

Las 8 tablas de datos reciben `tienda_id uuid not null references tiendas(id) on delete restrict`: `producto_bases`, `producto_variantes`, `categoria_atributos`, `items_reposicion`, `listas_reposicion_historial`, `items_reposicion_historial`, `items_vencimiento`, `items_vencimiento_historial`.

Se **desnormaliza en todas**, incluso donde es derivable por FK (variante→base, item→variante, item_historial→lista), por dos razones: las policies RLS quedan uniformes y sin joins (crítico para performance), y los índices únicos por tienda lo requieren. `on delete restrict` a propósito: borrar una tienda con datos es una operación administrativa fuera de scope y restrict previene borrados masivos accidentales.

**Triggers `BEFORE INSERT` de derivación incondicional.** En las tablas donde `tienda_id` es derivable, el trigger lo deriva **siempre, ignorando cualquier valor enviado por el cliente**. No es solo comodidad (minimizar el diff del cliente): es la garantía de consistencia. El `WITH CHECK` de RLS valida *membresía*, no *consistencia* — con derivación condicional (`if new.tienda_id is null`), un usuario miembro de dos tiendas (o un cliente con `tiendaActivaId` stale) podría insertar un item con `tienda_id = B` y variante de A, y ambos checks pasarían. La derivación incondicional lo hace imposible por construcción:

```sql
-- producto_variantes: deriva desde producto_base_id
-- items_reposicion, items_vencimiento, items_vencimiento_historial: desde variante_id
-- items_reposicion_historial: desde lista_id
create or replace function set_tienda_id_desde_variante() returns trigger
language plpgsql set search_path = public as $$
begin
  -- Incondicional: la tienda del item ES la de su variante; se ignora
  -- cualquier tienda_id del cliente. Como invoker, este select está sujeto
  -- a RLS: si la variante no es de una tienda del usuario, devuelve NULL
  -- y el insert falla acá.
  select tienda_id into new.tienda_id
    from producto_variantes where id = new.variante_id;
  if new.tienda_id is null then
    raise exception 'variante inexistente o fuera de tus tiendas: %', new.variante_id;
  end if;
  return new;
end; $$;
```

Con esto, los servicios del cliente (`src/services/reposicion.ts`, `src/services/vencimiento.ts`) **no envían `tienda_id` en ningún insert**. `tienda_id` explícito queda **solo** para las tablas raíz sin FK del cual derivarlo: `producto_bases` (lo pone el API route server-side) y `categoria_atributos` (gestión admin). `listas_reposicion_historial` lo setea la RPC `guardar_lista_reposicion` desde su parámetro.

#### 1.3 Cambios de constraints e índices

| Constraint actual | Cambio |
| --- | --- |
| `producto_variantes.codigo_barras UNIQUE` (global, 0001) | Drop → `unique (tienda_id, codigo_barras)`. El mismo EAN puede existir en dos tiendas |
| Unicidad de bases nombre+marca case-insensitive (0010) | Drop → recrear por `(tienda_id, lower(trim(nombre)), lower(trim(coalesce(marca,''))))` |
| Unicidad de `categoria_atributos` categoria+clave (0008) | Drop → recrear por `(tienda_id, coalesce(categoria,''), clave)` |
| Índice parcial de `items_reposicion` (un `'pendiente'` por variante, 0004) | **Sin cambio.** Una variante pertenece a una sola tienda (garantizado por §1.2), así que ya es único por tienda. Cambiarlo rompería el target del `ON CONFLICT` de `agregar_item_reposicion` (`0006:43`) sin ganar nada |

Índices nuevos: `idx_<tabla>_tienda_id` en las 8 tablas (soporte RLS) y compuestos para hot paths: `items_reposicion (tienda_id, estado)`, `items_vencimiento (tienda_id, estado, fecha_vencimiento)`, `listas_reposicion_historial (tienda_id, fecha_guardado desc)`, `items_vencimiento_historial (tienda_id, fecha_retiro desc)`.

#### 1.4 Migración de datos de producción

En una sola migración transaccional (**`0012`** — `0011` ya existe: `0011_estadisticas_vencimiento.sql`):

1. Crear la tienda inicial con un **UUID fijo elegido de antemano**: `insert into tiendas (id, nombre) values ('<UUID-FIJO>', 'Mi Tienda')`.
2. Agregar `tienda_id` **nullable con `DEFAULT '<UUID-FIJO>'`** a las 8 tablas.
3. Backfill: `update <tabla> set tienda_id = '<UUID-FIJO>' where tienda_id is null`.
4. `alter table ... set not null`.

El `DEFAULT` se **mantiene durante toda la Fase 1** porque en esa fase **ningún cliente envía `tienda_id`** — el scoping del cliente y los triggers de derivación llegan recién en Fase 2; el DEFAULT sostiene a todos los clientes, nuevos y viejos. Se elimina en la Fase 2, cuando los triggers lo reemplazan. El usuario real existente se vincula manualmente tras registrarse: `insert into tienda_miembros (tienda_id, user_id, rol) values ('<UUID-FIJO>', '<uid>', 'admin')` — un solo usuario en producción no justifica automatizarlo.

#### 1.5 RPCs y funciones

Las **5** RPCs existentes pasan de `SECURITY DEFINER` a **`SECURITY INVOKER`** (RLS como único punto de enforcement), más `revoke execute ... from anon`:

- **`agregar_item_reposicion(p_variante_id, p_cantidad)`** — firma sin cambios. Como invoker: si la variante no es de una tienda del usuario, el `select` interno no la ve y el insert falla el `WITH CHECK`. El trigger de derivación completa `tienda_id`.
- **`guardar_lista_reposicion(p_tienda_id uuid)`** — **gana parámetro** (un usuario puede pertenecer a varias tiendas; la "tienda activa" viene del cliente). Todos los `from items_reposicion` ganan `where tienda_id = p_tienda_id` — **imprescindible, no redundante**: como invoker, RLS filtra por *todas* las tiendas del usuario, no por la activa; sin este WHERE, un usuario con dos membresías que guarda la lista de A archivaría y vaciaría también los items pendientes de B (el delete vigente es tabla entera: `0005:59`). El insert al historial setea `tienda_id`, y el `delete from items_reposicion where id is not null` pasa a `where tienda_id = p_tienda_id` (mantiene la regla "DELETE con WHERE" de la migración 0005). Guard inicial: `if p_tienda_id not in (select mis_tiendas()) then raise exception` (helper definido en §2.1).
- **`retirar_item_vencimiento(p_item_id)` / `retirar_items_vencimiento(p_item_ids)`** — firmas sin cambios; invoker + trigger de derivación en el insert al historial. Con RLS, los ids ajenos simplemente "no existen".
- **`obtener_estadisticas_vencimiento(p_tienda_id, p_desde, p_hasta)`** (0011) — **gana `p_tienda_id`** y pasa a invoker; el `with retirados` filtra `where tienda_id = p_tienda_id and fecha_retiro ...`. Sin esto, cualquier usuario vería estadísticas y nombres de productos de **todas** las tiendas — con catálogo privado por tienda, son datos comerciales. Es, junto con `guardar_lista_reposicion`, la **segunda firma que cambia en el cliente** (`src/services/vencimiento.ts:216`). Su fallback client-side por `PGRST202` (`vencimiento.ts:234-238`) se **elimina**: post-migración la RPC existe siempre, y el fallback sin scopear agregaría sobre todas mis tiendas en vez de la activa.
- **`armar_nombre_completo(...)`** (0008) — gana `p_tienda_id` y filtra `categoria_atributos` por tienda; el trigger `set_nombre_completo()` le pasa `new.tienda_id`. Sin esto, los nombres derivados mezclarían definiciones de atributos de otras tiendas.

Nuevas RPCs `SECURITY DEFINER` (resuelven el huevo-y-gallina de RLS: sin membresía no podés insertar membresías). **Regla para todas**: como DEFINER bypasea las policies, cada guard que la policy ya no aplica va escrito *dentro* de la función, y cada una lleva `revoke execute ... from anon` **en la misma migración que la crea** (hoy no hay un solo GRANT/REVOKE en `supabase/` y el EXECUTE default alcanza a `anon`):

- **`crear_tienda_con_admin(p_nombre text) returns uuid`**: inserta tienda + membresía admin del caller + seed de las 3 filas default de `categoria_atributos` (tipo/sabor/tamaño, como el seed de 0008), en una transacción. Guard: `auth.uid() is not null`.
- **`canjear_invitacion(p_codigo text) returns uuid`**: el canje es un **UPDATE atómico**, no check-then-increment (dos canjes concurrentes de un código de 1 uso entrarían ambos), y un re-canje de alguien que ya es miembro no quema usos:

  ```sql
  if auth.uid() is null then raise exception 'requiere sesión'; end if;

  -- Idempotencia sin quemar usos: si ya es miembro, devolver la tienda.
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

- **`generar_codigo_invitacion(p_tienda_id, p_rol, p_max_usos, p_dias)`**: centraliza la generación del código con `gen_random_bytes` (alfabeto sin ambiguos). **Guard obligatorio en la primera línea** — como DEFINER, sin él cualquier empleado (o cualquier autenticado) emitiría invitaciones de cualquier tienda con `p_rol = 'admin'`, escalada directa:

  ```sql
  if p_tienda_id not in (select mis_tiendas_admin()) then
    raise exception 'Solo un admin de la tienda puede generar invitaciones';
  end if;
  ```

Los helpers `mis_tiendas()`/`mis_tiendas_admin()` (§2.1) pueden quedar ejecutables por `anon`: con `auth.uid()` NULL devuelven set vacío.

### 2. RLS

#### 2.1 Patrón: subquery `IN` sobre helpers `SECURITY DEFINER`

```sql
create or replace function public.mis_tiendas() returns setof uuid
language sql stable security definer set search_path = public as
$$ select tienda_id from tienda_miembros where user_id = (select auth.uid()) $$;

create or replace function public.mis_tiendas_admin() returns setof uuid
language sql stable security definer set search_path = public as
$$ select tienda_id from tienda_miembros where user_id = (select auth.uid()) and rol = 'admin' $$;
```

Policy tipo: `using (tienda_id in (select mis_tiendas()))`.

Alternativas evaluadas y descartadas:

- **Claim `tienda_id` en el JWT** (custom access token hook): la más rápida en runtime, pero los claims quedan stale — expulsar a un empleado no surte efecto hasta el refresh del token (hasta 1 hora). Además complica multi-tienda y agrega un hook que mantener. (Ver la limitación declarada en §Preguntas abiertas: la revocación server-side con helpers es inmediata, pero ninguna variante revoca la copia local ya descargada.)
- **Subquery directa a `tienda_miembros` en cada policy**: funciona para las tablas de datos, pero causa **recursión infinita** en las policies de `tienda_miembros` mismo (ver a los demás miembros ⇒ la policy consulta la propia tabla). El helper `SECURITY DEFINER` evita la recursión y unifica el patrón.

**Performance**: la forma `col in (select funcion_estable())` no referencia columnas de la fila, así que Postgres la evalúa **una vez por statement** (InitPlan), no por fila — es el patrón recomendado por la guía de performance de RLS de Supabase. `auth.uid()` va envuelto en `(select ...)` por el mismo motivo. Con los índices `idx_*_tienda_id` y tablas de este tamaño, el overhead es despreciable.

#### 2.2 Policies por tabla y operación

Todas `TO authenticated`. **Se eliminan todas las policies `allow_all_anon` enumerando las 8 tablas** — 7 creadas en `0002_enable_rls.sql` y la de `categoria_atributos` en `0008:73-75`; un drop guiado solo por la 0002 dejaría abierta a `anon` justamente la tabla que leen los API routes. `anon` queda sin ninguna policy = acceso denegado. Nomenclatura: `<tabla>_<operacion>_<quien>` (ej. `items_reposicion_select_miembros`).

| Tabla | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `tiendas` | miembro (`id in mis_tiendas()`) | — (solo RPC definer) | admin (renombrar) | — (fuera de scope) |
| `tienda_miembros` | miembro de la tienda | — (solo RPC) | admin (cambiar rol) | admin, o `user_id = (select auth.uid())` (salir de la tienda) |
| `tienda_invitaciones` | admin | admin (o solo RPC) | admin (revocar) | admin |
| `producto_bases`, `producto_variantes` | miembro | miembro (`with check` mismo predicado) | miembro | **admin** |
| `categoria_atributos` | miembro | admin | admin | admin |
| `items_reposicion`, `items_vencimiento` | miembro | miembro | miembro | miembro |
| `listas_reposicion_historial`, `items_reposicion_historial`, `items_vencimiento_historial` | miembro | miembro (lo necesitan las RPCs invoker) | — | **admin** |

#### 2.3 Matriz de roles

- **Empleado**: operar ambas listas (agregar/editar/eliminar/retirar), escanear, crear productos en el catálogo, guardar lista de reposición, ver historial y estadísticas, ver el equipo.
- **Admin**: todo lo anterior + renombrar tienda, crear/revocar invitaciones, cambiar roles, expulsar miembros, **borrar entradas de historial** (es el registro de auditoría del trabajo hecho — un empleado no debería poder borrar evidencia), borrar productos del catálogo, gestionar `categoria_atributos`.

Guard adicional (trigger o policy): **el último admin no puede degradarse ni salir de la tienda**. La UI oculta acciones según rol y tolera "0 filas afectadas" si una UI vieja lo intenta.

#### 2.4 Verificación del aislamiento

Obligatoria antes de cerrar la Fase 2. Hoy **no existe** infraestructura de integración (los 18 archivos de test son unit con Supabase mockeado vía `src/tests/mocks/supabaseMock.ts`), así que el harness se define acá y se monta en Fase 0:

- **Stack**: `supabase start` local (el CLI ya es la herramienta de migraciones del repo) o el branch de staging de Fase 0.
- **Runner**: proyecto vitest separado (`vitest.integration.config.ts`, environment `node`, sin mocks), excluido del run default y del coverage.
- **Fixtures**: dos usuarios creados vía Admin API con la `service_role` key local (`auth.admin.createUser`), JWTs reales obtenidos con `signInWithPassword`; cada test corre con dos clientes autenticados distintos.
- **Matriz**: por cada tabla × operación, A no ve ni modifica datos de B; las **5 RPCs** con ids ajenos fallan (incluida `obtener_estadisticas_vencimiento` con fechas amplias y dos tiendas con historial); y el caso **multi-membresía**: usuario miembro de A y B, items pendientes en ambas, `guardar_lista_reposicion(A)` no toca los de B — la matriz de usuarios disjuntos no lo cubre y es el escenario que justifica el `WHERE` de §1.5.

Complementar con el linter de seguridad de Supabase (`get_advisors`), que detecta `SECURITY DEFINER` sin `search_path`, tablas sin RLS, etc.

### 3. Auth en el cliente

#### 3.1 `@supabase/ssr` con cookies (elegido) vs `supabase-js` + localStorage

**Elegido: `@supabase/ssr`.** Razones:

1. Los API routes necesitan el JWT del usuario para operar con RLS. Con cookies, `createServerClient` lo obtiene gratis en el route handler; con localStorage habría que adjuntar `Authorization: Bearer` manualmente en cada fetch y construir un cliente server con ese token.
2. `src/proxy.ts` (Edge) puede refrescar la sesión y hacer gate de rutas leyendo cookies; con localStorage el Edge es ciego a la sesión.
3. Es el camino documentado y mantenido por Supabase para Next.js App Router.

**Offline (la duda válida en esta PWA)**: las cookies se leen sin red — `createBrowserClient` restaura la sesión en arranque frío offline igual que localStorage. El access token expira (default 1h) y offline no se puede refrescar, pero **no importa**: todas las lecturas offline salen del cache IDB de React Query y las escrituras van al outbox — no hay llamadas a Supabase que necesiten JWT válido hasta que vuelve la red. Al reconectar, `autoRefreshToken` renueva con el refresh token y recién entonces corre `processQueue`.

⚠️ Config de Supabase Auth: "time-box user sessions" e "inactivity timeout" deben quedar **deshabilitados** (default), para que una semana sin abrir la app no mate la sesión.

Cambios concretos:

- `src/lib/supabase.ts` → `createBrowserClient(url, anonKey)` de `@supabase/ssr` (API compatible; los servicios no cambian).
- Nuevo `src/lib/supabaseServer.ts` → `createServerClient` con cookies para route handlers.
- `src/proxy.ts` → refresh de sesión (patrón `getClaims()`/`getUser()` de la guía de middleware de Supabase) + redirect a `/login` en rutas protegidas. Rutas públicas: `/login`, `/registro`, `/unirse`, `/recuperar`, `/restablecer`, assets. **El gate del proxy es best-effort**: en arranque offline el service worker sirve el shell cacheado sin pasar por el Edge, así que el gate real de UX es client-side (`AuthProvider`).

#### 3.2 Flujos y pantallas nuevas

| Ruta | Contenido |
| --- | --- |
| `/registro` | Email + contraseña. Post-confirmación, onboarding: "Crear tienda" (→ `crear_tienda_con_admin`) o "Tengo un código" (→ `canjear_invitacion`) |
| `/login` | Login clásico |
| `/recuperar` | `resetPasswordForEmail` con `redirectTo` a `/restablecer` |
| `/restablecer` | `updateUser({ password })` sobre la sesión del link |
| `/unirse?codigo=X` | Canje de invitación (logueado o como paso post-registro) |
| `/tienda` | Nombre de la tienda (admin edita), miembros con rol, expulsar/cambiar rol (admin), generar/revocar códigos (admin), "salir de la tienda" |

- **Confirmación de email deshabilitada en Fase 1** (login inmediato post-signup) para no depender de SMTP el día uno; se activa después si aparece abuso. La protección anti-abuso de signup/login es la de **Supabase Auth** (rate limits del dashboard, CAPTCHA integrado si hiciera falta) — ver §5: el proxy no puede limitar auth.
- **`AuthProvider`** (`src/components/AuthProvider.tsx`): suscripción a `onAuthStateChange`, expone `{ user, tiendaActiva, rol }` por contexto. `tiendaActiva`: la única membresía en el caso típico; si hay varias, selector persistido. Va en `layout.tsx` **por fuera** de `QueryProvider` (los hooks de datos necesitan `tiendaId` para las query keys y el persister necesita la identidad para el buster).
- **Logout con limpieza local obligatoria** (es un dispositivo potencialmente compartido en la tienda — es requisito de privacidad, no polish). Se implementa como **una función única `limpiarEstadoLocal()`**, reutilizada por el logout y por el caso "cambio de usuario detectado", con la lista completa:
  1. Avisar si `useOutboxStore.pendingCount > 0` ("Tenés N cambios sin sincronizar").
  2. `supabase.auth.signOut()`.
  3. Query cache de IDB (`gondolapp-query-cache`) + cola del outbox (`gondolapp-outbox`).
  4. **Caches del service worker**: `caches.delete()` de `gondolapp-dynamic-*` y `gondolapp-api-*` (§6 — es donde el SW guarda respuestas con datos).
  5. localStorage de datos: `gondolapp-recents`, `gondolapp-vencimientos-notificados`; cancelar las notificaciones locales programadas de vencimientos.
  6. Redirect a `/login`. (`gondolapp-theme`/`gondolapp-ui` quedan: preferencias de dispositivo, sin datos.)

### 4. Capa de datos del cliente

#### 4.1 Query keys namespaced por tienda

Todas las keys ganan el prefijo de tienda: `["tienda", tiendaId, "reposicion", "items"]`. Ubicaciones reales de las keys hoy: constantes privadas en `src/hooks/useReposicion.tsx:12-14` y `useVencimiento.tsx:11-13` (items/historial/estadísticas), `CATALOGO_COMPLETO_KEY` **exportada** en `useCatalogoCompleto.ts:6` (reusada en `ScanFlow.tsx`, `CatalogoSyncProvider.tsx`, `useScanProduct.ts`) y la factory `eanQueryKey` en `useScanProduct.ts:44-46`. (`useMarcasCategorias` no tiene key propia: deriva del catálogo en memoria.)

Implementación: extraer todo a factories `(tiendaId) => [...]` en un módulo nuevo `src/lib/queryKeys.ts`; los hooks leen `tiendaId` del `AuthProvider` con `enabled: !!tiendaId`. El namespacing cubre **también catálogo y EAN** — son 2 de las 4 familias que persiste `esQueryPersistible` (`src/lib/queryPersister.ts:52-59`: reposicion/items, vencimiento/items, catalogo/completo, producto/ean), que se actualiza a la forma con prefijo. La invalidación por prefijo de `OutboxProvider.tsx:25-26` pasa a `["tienda", tiendaId, "reposicion"]`/`["tienda", tiendaId, "vencimiento"]`.

#### 4.2 Aislamiento del cache IDB

**Buster por identidad**: `buster: "v4:${userId}:${tiendaId}"` en `src/app/QueryProvider.tsx` (hoy `"v3"`, `:38`). Cambia el usuario o la tienda → el persister descarta el cache restaurado. Es la opción simple y suficiente (stores IDB por tienda solo valdría la pena si el cambio de tienda fuera frecuente — no lo es). Cubre también el catálogo offline-first: `catalogoLocal.ts` son funciones puras sobre la query persistida `["catalogo","completo"]`, sin store propio, así que el buster lo aísla sin trabajo extra. Se complementa con `limpiarEstadoLocal()` (§3.2). Nota de implementación: el buster requiere conocer la identidad antes de montar `PersistQueryClientProvider`, así que `AuthProvider` resuelve la sesión inicial desde cookie y `tiendaActivaId` desde el store persistido (§4.4) antes de renderizar el provider de queries — reordenar `layout.tsx`.

#### 4.3 Outbox

- **Identidad en la cola**: cada `OutboxOperation` (`src/lib/outbox/types.ts`) gana `userId` y `tiendaId`; los helpers `ejecutarOEncolar` (en `src/lib/outbox/mutationHelpers.ts`, invocados desde los hooks) los toman del contexto. `QUEUE_KEY` pasa a `"queue:${userId}"` (aislamiento extra entre usuarios en el mismo dispositivo).
- **`processQueue` + sesión**: antes de arrancar, `await supabase.auth.getSession()` — si el access token está por expirar, el propio `getSession` dispara el refresh; si no hay sesión, abortar sin vaciar la cola. Operaciones cuyo `userId` no coincide con la sesión actual se **saltean, no se descartan** (el logout limpio ya vació la cola; esto cubre el caso patológico).
- **🔴 Fix crítico en la clasificación de errores** (`outbox.ts:85-89`): los errores 401/`PGRST301`/JWT expired deben tratarse como **reintenables** (cortar la corrida, como los errores de red), no como "error de datos" que descarta la operación. Sin este fix, una sesión expirada al volver online pierde silenciosamente todo el trabajo offline. (Un 403 por RLS sí se descarta: reintentar no lo va a arreglar.)
- **tempIds**: el mecanismo `offline:UUID` → remap es ortogonal a la tienda y no cambia. **Riesgo conocido que se declara**: el `idMap` de remap es por-corrida (`outbox.ts:73`, local a cada `processQueue`); si una creación se sincroniza y la app se recarga antes de que salgan sus updates dependientes, esos updates quedan con `offline:` sin resolver y se descartan. Es preexistente, pero el fix del 401 (cortar y reanudar corridas) hace el escenario más frecuente. **Punto de decisión en Fase 2** (se toca el mismo archivo): pagar el fix (persistir el mapping junto a la cola, o reescribir los ids encolados al sincronizar la creación) o documentarlo como edge case aceptado.
- **RPCs**: solo `guardarLista` cambia de firma en `src/services/reposicion.ts` (agrega `p_tienda_id`); esa operación no pasa por el outbox (requiere online: `useReposicion.tsx:297-301`), así que el outbox no necesita conocer la nueva firma. Lo mismo vale para `obtener_estadisticas_vencimiento` (lectura, nunca encolada).

#### 4.4 Stores de Zustand

- **`src/store/recents.ts`** (persistido): reestructurar a `entries: Record<tiendaId, Record<varianteId, RecentEntry>>` con los selectors leyendo la tienda activa — mejor que nombres de storage dinámicos (el middleware `persist` no los soporta bien). Limpiar al logout.
- **`src/store/notificaciones.ts`** (persistido): el flag `habilitadas` es preferencia de dispositivo y queda; el set de "ya notificado" (`gondolapp-vencimientos-notificados`, localStorage en `src/lib/notificacionesVencimiento.ts`) pasa a estar keyed por tienda y entra en `limpiarEstadoLocal()`.
- **Nuevo `useSesionStore`** (o extensión de `ui`): `tiendaActivaId` persistido (necesario para multi-tienda y para el buster en arranque offline).
- `theme`, `ui`, `feedback`, `outbox`: preferencias/estado de dispositivo, sin cambios.

### 5. API routes y rate limiting

- **Inyección de cliente en servicios**: las funciones de `src/services/catalogo.ts` que se usan server-side (`crearProductoManual`, `obtenerDefinicionesAtributos`, `obtenerMarcasYCategorias`) ganan parámetro `client: SupabaseClient = supabase` (default al singleton browser → cero cambio para el resto de la app). **La inyección atraviesa también `src/services/parseoProducto.ts`**, que llama `obtenerDefinicionesAtributos` server-side: `parsearProducto` recibe y propaga el client (o las definiciones ya resueltas). Las otras 6 funciones de `catalogo.ts` (`buscarPorCodigoBarras`, `obtenerProductoPorVarianteId`, `buscarProductos`, `buscarVariantes`, `obtenerProductosPorVarianteIds`, `obtenerCatalogoCompleto`) son browser-only y no cambian — este es el alcance cerrado del refactor de Fase 0. Los routes crean el cliente por-request con `createServerClient` (cookies) y lo pasan. RLS scopea automáticamente marcas/categorías/atributos a la tienda del usuario.
- **`/api/productos/crear-manual`**: gate al inicio (`getUser()` → 401 sin sesión). El body gana `tiendaId` (tienda activa del cliente); el servidor valida membresía implícitamente vía el `WITH CHECK` de RLS al insertar `producto_bases` (tabla raíz: es de las dos que sí llevan `tienda_id` explícito, §1.2). La búsqueda de duplicados (EAN, base por nombre+marca) queda scoped por RLS sin cambios de código.
- **`/api/productos/parsear`**: mismo gate 401 — protege el gasto de IA detrás de auth, no solo detrás del rate limit por IP. Solo lee `categoria_atributos` → cliente por-request.
- **Rate limiting por usuario** en `src/proxy.ts`: el identifier pasa de `ip:${ip}` a `user:${sub}` cuando hay cookie de sesión, con fallback a IP. Para no pagar verificación completa de JWT en el Edge por request, alcanza con decodificar el `sub` **sin verificar firma solo para la clave de rate limit** (spoofearlo solo cambia tu bucket; la autorización real la hace el route handler). La CSP de `addSecurityHeaders` no cambia (`connect-src 'self' https://*.supabase.co`, `proxy.ts:243`, ya cubre Auth).
- **Fuerza bruta en login/signup**: el proxy **no puede** protegerlo y esta spec no lo intenta — solo limita `/api/*` (`proxy.ts:73`) y los POST de credenciales van del navegador directo a `*.supabase.co/auth/v1/*`, sin pasar por Vercel. La protección es el rate limiting propio de Supabase Auth (dashboard → Auth → Rate limits) y, si apareciera abuso, su CAPTCHA integrado.

### 6. Service worker (Fase 1 — obligatorio, no polish)

El SW es **custom** (`public/sw.js`; next-pwa solo lo registra — su `runtimeCaching` en `next.config.js` está inerte). Hoy su handler `fetch` cachea en Cache Storage los GETs de `/api/*` (`API_CACHE`, `sw.js:96-98`) y, por el default network-first, **también los de Supabase REST** (`DYNAMIC_CACHE`, `sw.js:119-121`). Cache Storage no distingue usuarios: sin cambios, en el dispositivo compartido el usuario B podría recibir offline respuestas de PostgREST cacheadas del usuario A — una fuga que sortea RLS por completo. Dos cambios, ambos en Fase 1:

1. **Excluir Supabase del SW** (network-only; el offline de datos ya lo resuelve el persister de React Query con buster por identidad):

   ```js
   // Nunca cachear Supabase (REST/Auth/Storage): el offline de datos lo
   // maneja el persister de React Query en IDB, aislado por identidad.
   if (url.hostname.endsWith(".supabase.co")) {
     return;
   }
   ```

2. **Purga en `limpiarEstadoLocal()`** (§3.2): `caches.delete()` de `gondolapp-dynamic-*` y `gondolapp-api-*` — cubre los `/api/*` que sí se siguen cacheando.

Además, **update prompt del PWA en Fase 1** (movido desde Fase 4): el corte de `anon` de la Fase 1 rompe toda instalación vieja (§Riesgos), así que el mecanismo para empujar la versión nueva tiene que existir *antes* del corte, no tres fases después.

### 7. Realtime (Fase 4, opcional pero recomendado)

El valor real aparece con 2+ empleados activos simultáneos, y el riesgo de meterlo temprano es alto porque interactúa con el sistema más delicado de la app (optimistic updates + outbox). Diseño:

- **Quick win primero (sin realtime)**: `refetchInterval: 30_000` con la pestaña visible + `refetchOnWindowFocus: true` en las dos queries de listas activas. Cubre ~80% del valor colaborativo con 5 líneas.
- **Realtime después**: canal `postgres_changes` sobre `items_reposicion` e `items_vencimiento` con filtro `tienda_id=eq.${tiendaId}` (habilitar la publication `supabase_realtime` para esas 2 tablas; RLS aplica al canal con token authenticated).
- **Handler minimalista**: solo **invalidar** `["tienda", tiendaId, "reposicion"|"vencimiento", "items"]` con debounce (300–500 ms), **nunca** aplicar el payload directo al cache — evita conflictos con optimistic updates y el eco de las propias mutaciones. Suspender invalidaciones mientras `useOutboxStore` reporte `isSyncing === true` (la corrida del outbox ya invalida al final).
- Free tier: 200 conexiones concurrentes / 2M mensajes por mes — irrelevante para equipos de 2–10 personas.

---

## Roadmap por fases

Cada fase termina con la app funcionando en producción.

### Fase 0 — Preparación (2–4 días, sin cambio de comportamiento)

- Refactor: servicios server-usables de `catalogo.ts` **y `parseoProducto.ts`** aceptan `client` param con default al singleton (alcance cerrado en §5); extraer factories de query keys a `src/lib/queryKeys.ts` (ubicaciones reales en §4.1).
- Staging: branch de Supabase (o proyecto espejo) con dump de producción para ensayar migraciones.
- **Harness de tests de integración** (§2.4): stack local `supabase start`, `vitest.integration.config.ts`, fixtures de usuarios vía Admin API. Se monta acá para que la Fase 2 lo consuma, no lo improvise.
- Baseline de tests verde.

✅ **Verificable**: `npm test` verde; app idéntica; ensayo de restore de dump OK; el harness corre un smoke test contra el stack local.

### Fase 1 — Auth + tienda única implícita (4–7 días)

- Dependencia nueva: `@supabase/ssr`. Nuevos: `supabaseServer.ts`, `AuthProvider`, pantallas `/login`, `/registro`, `/recuperar`, `/restablecer`; gate en `proxy.ts`; logout con `limpiarEstadoLocal()` completa (§3.2); SMTP custom (Resend) configurado; confirmación de email deshabilitada.
- **Service worker** (§6): exclusión de `*.supabase.co`, purga de caches en logout, update prompt del PWA.
- **Migración `0012_tiendas_y_backfill.sql`** (la numeración arranca en 0012: `0011_estadisticas_vencimiento.sql` ya existe): tablas `tiendas`/`tienda_miembros`/`tienda_invitaciones` + `tienda_id` en las 8 tablas con `DEFAULT '<uuid-inicial>'` + backfill + `not null` + índices. **RLS intermedio**: se eliminan las policies de `anon` **en las 8 tablas** (0002 + la de `categoria_atributos` en 0008); `authenticated` mantiene `using (true)` — el hardening por tienda llega en Fase 2, esto permite que la app funcione sin scoping en el cliente.
- ⚠️ **El corte de `anon` rompe toda PWA no logueada ese mismo día** (§Riesgos): coordinar con el usuario real login + recarga de la app el día del deploy.
- ⚠️ **Signups públicos deshabilitados** (config Auth: "Allow new users to sign up" = off): con el RLS intermedio, cualquier cuenta autenticada vería los datos de la tienda de producción. Las cuentas de las Fases 1–2 se crean manualmente desde el dashboard; los signups se habilitan recién en la Fase 3, cuando el scoping por tienda (Fase 2) y el onboarding existen.
- Alta manual del usuario real como admin de la tienda inicial.

✅ **Verificable**: requests anónimas a PostgREST devuelven 0 filas/error **en las 8 tablas**; la tienda actual opera igual que antes tras loguearse; el reset de contraseña llega por email; el arranque offline con sesión funciona; ningún GET de `*.supabase.co` aparece en Cache Storage tras navegar la app.

### Fase 2 — Scoping real: RLS por tienda + cliente scoped (5–8 días, la más riesgosa)

- **Migración `0013_constraints_por_tienda.sql`**: drop/recreate de los 3 índices únicos (§1.3), índices de soporte, triggers de derivación **incondicional** de `tienda_id` (§1.2), drop de los `DEFAULT`.
- **Migración `0014_rls_por_tienda.sql`**: helpers `mis_tiendas()`/`mis_tiendas_admin()`, policies de §2.2, `revoke` a `anon` de las RPCs.
- **Migración `0015_rpcs_multitienda.sql`**: las **5** RPCs a invoker (+ `guardar_lista_reposicion(p_tienda_id)` + `obtener_estadisticas_vencimiento(p_tienda_id, ...)`), `armar_nombre_completo` tienda-aware, `crear_tienda_con_admin`, `canjear_invitacion` (canje atómico), `generar_codigo_invitacion` (guard admin) — con sus `revoke ... from anon` (§1.5).
- Cliente: query keys por tienda (incluidas catálogo y EAN, §4.1), buster `v4:${user}:${tienda}`, outbox con `userId` + fix de errores 401 (+ decisión sobre el remap de tempIds, §4.3), recents y set de notificados por tienda, `vencimiento.ts` pasa `p_tienda_id` a estadísticas y pierde el fallback client-side, API routes con cliente por-request + gate 401, rate limit por usuario.
- **Suite de tests de aislamiento RLS** sobre el harness de Fase 0 (§2.4).

✅ **Verificable**: suite de aislamiento verde (tienda B no ve nada de A, **incluidas las estadísticas de vencimiento**; el caso multi-membresía de `guardar_lista` no cruza tiendas); el mismo EAN es creable en dos tiendas; el outbox sobrevive a un JWT expirado offline (test con token de vida corta).

### Fase 3 — Invitaciones, roles y gestión de equipo (3–5 días)

- Onboarding post-registro (crear tienda / canjear código), `/unirse?codigo=`, pantalla `/tienda` (miembros, roles, invitaciones, renombrar, expulsar, salir).
- **Habilitar signups públicos** (deshabilitados desde la Fase 1): con el scoping de la Fase 2, una cuenta nueva sin membresía no ve ningún dato hasta crear tienda o canjear un código.
- UI condicionada por rol (ocultar borrado de historial/catálogo a empleados).
- Guard "último admin no puede degradarse/salir".

✅ **Verificable**: flujo completo invitar → registrarse → canjear → operar la misma lista desde 2 cuentas; un empleado no puede borrar historial (UI y RLS); código expirado/revocado/agotado rechazado; dos canjes concurrentes de un código de 1 uso → uno solo entra.

### Fase 4 — Colaboración en vivo y polish (2–3 días)

- Quick win primero: `refetchInterval` con pestaña visible + `refetchOnWindowFocus` en las listas activas; después realtime `postgres_changes` por tienda con invalidación debounced (§7).
- Polish: runbook operativo en `docs/`, opcional presence "quién está en la lista".

✅ **Verificable**: dos dispositivos logueados ven el cambio del otro en <2 s online; sin regresión del flujo offline.

---

## Preguntas abiertas, decisiones diferidas y limitaciones declaradas

**Diferidas:**

- **Confirmación de email**: deshabilitada en Fase 1; activar si aparece abuso de signup (la primera línea de defensa son los rate limits/CAPTCHA de Supabase Auth, §5).
- **Catálogo semilla global de solo lectura**: mitigaría el arranque en frío del catálogo de tiendas nuevas. Evaluar después de la Fase 3.
- **Selector multi-tienda en UI**: el modelo de datos lo soporta desde el día uno; la UI completa (cambiar de tienda activa) solo se construye si aparece el caso real.
- **Presence** ("quién más está mirando la lista"): opcional en Fase 4.
- **Borrado de tiendas**: operación administrativa fuera de scope (por eso `on delete restrict` en los datos).
- **Auditoría por usuario** (`agregado_por`/`actualizado_por` en items): barato de agregar en la Fase 2 (columna + `default auth.uid()`), pero se difiere hasta que haya una necesidad de UI concreta.
- **Remap de tempIds entre corridas del outbox** (§4.3): punto de decisión en Fase 2 — pagar el fix o documentar el edge case.

**Limitaciones declaradas (aceptadas, sin arreglo dentro de este diseño):**

- **La copia local ya descargada no es revocable remotamente.** La revocación server-side es inmediata (expulsar a un miembro corta su acceso en el primer request online — por eso se eligieron los helpers de §2.1 sobre claims JWT), pero un dispositivo que queda offline conserva legible su último cache local (IDB + `tiendaActivaId` persistido) indefinidamente. Es inherente al offline-first. Si algún día importa, las opciones conocidas (TTL corto del cache persistido, wipe remoto vía push) tienen costos de UX que hoy no se justifican. No debe venderse "expulsión instantánea" como garantía de que el ex-empleado no ve nada.
