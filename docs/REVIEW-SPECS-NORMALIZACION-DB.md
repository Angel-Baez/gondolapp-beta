# 🔎 Análisis crítico — SPEC-NORMALIZACION-DB (CON-IA / SIN-IA)

> **Objetivo**: refinar ambas specs. No es un rechazo: el núcleo es sólido. Lo que sigue prioriza por impacto, da el riesgo concreto de cada debilidad y, donde corresponde, muestra la reescritura. Cuando algo no tiene arreglo obvio, se dice.
> **Verificado contra**: main `2d6adaf` — las citas `archivo:línea` de ambas specs se contrastaron con el árbol y coinciden (firma de `armar_nombre_completo` en `0015:259`, `sugerencias text[]` en `0008:66`, contrato `"ya existe"`→409 en `crear-manual/route.ts:131`, y los dos bugs reales: EAN sin trim en `catalogo.ts:222` vs con trim en `:268`, y el alta base+variante en dos inserts sin transacción `catalogo.ts:245-273`).
> **Alcance de la revisión**: crítica de las specs como diseño, no de código implementado (nada está implementado).

---

## Resumen de la recomendación

El **núcleo determinístico (§4.1–§4.3)** es ganancia neta y está bien resuelto — se puede aprobar con dos correcciones puntuales (P0-2 y P1-2). La spec **SIN-IA** es implementable casi tal cual una vez atendidos P0-2 y P1-2. La spec **CON-IA** tiene un hueco de diseño real (P0-1, concurrencia de la máquina de estados) y una fragilidad estructural sin arreglo limpio (P1-1, dependencia del happy path en una tabla interna de pg_net); ambos deben resolverse/aceptarse explícitamente antes de comprometerse con ese camino.

| # | Spec | Hallazgo | Impacto |
| --- | --- | --- | --- |
| P0-1 | CON-IA | Sin control de concurrencia en la máquina de estados `parseos` | Alto |
| P0-2 | Núcleo (ambas) | `marca_canonica`/`categoria_canonica`: `limit 1` sin `order by` → canónico no determinístico | Alto |
| P1-1 | CON-IA | El happy path depende de `net._http_response`, la misma tabla interna que la spec rechaza para triggers | Alto (sin arreglo limpio) |
| P1-2 | SIN-IA | Garantía de preview sobredeclarada ("literalmente lo que se guardará") | Medio-alto |
| P1-3 | CON-IA | El plan de testing exige URL de proveedor redirigible que §4.4.4 no provee | Medio |
| P2-1 | CON-IA | Tope de poll del cliente (20s) < timeout del janitor (45s): zona muerta de UX | Medio |
| P2-2 | Ambas | "§4.1–§4.3 idénticos" pero el SQL canónico vive solo en SIN-IA | Medio (proceso) |
| P2-3 | SIN-IA | El backfill no dedupe bases preexistentes → alimenta P0-2 | Medio |
| P3-x | Varias | Comentario RLS engañoso, rate limit cuenta errores, estimaciones | Bajo |

---

## Fortalezas (preservar y replicar)

Esto está bien resuelto y conviene usarlo como criterio en el resto:

1. **Honestidad del trade-off (CON-IA).** El "Advertencia honesta, para decidir con los ojos abiertos" del resumen y la sección Riesgos declarando UX peor, observabilidad degradada, lock-in y secretos en `net` son ejemplares. Una spec que argumenta en contra de sí misma es más confiable, no menos. **Replicar**: toda spec de este repo debería tener una sección Riesgos que liste lo que empeora, no solo lo que mejora.
2. **Disciplina de verificación.** Citas `archivo:línea` contra un commit fijado + regla operativa "re-verificar el inventario de Estado actual antes de cada fase" (heredada de `SPECMULTIUSER.md`). Verifiqué una muestra y son exactas. Esto es lo que hace la spec auditable.
3. **Diagnóstico correcto de dos bugs reales.** Alta no-atómica (base huérfana si falla el segundo insert) y TOCTOU/inconsistencia del dup-check de EAN. Ambos confirmados en el código. Arreglarlos "de paso" con el RPC transaccional es la decisión correcta.
4. **Orden de triggers por nombre como invariante de diseño.** `derivar < limpiar < nombre`, con la regla escrita para el futuro y el precedente citado (`0015:253-254`). Coincide con la semántica real de Postgres (triggers del mismo evento disparan en orden alfabético) y con la firma vigente de `set_nombre_completo`. Es diseño maduro, no accidental.
5. **Factorización en helpers puros para que preview y write compartan código (SIN-IA §4.4).** Es la forma correcta de evitar deriva de *lógica* entre lo que se muestra y lo que se guarda. (Su límite es la deriva *temporal* — ver P1-2 — pero el instinto es el correcto.)
6. **Madurez en Postgres.** `f_unaccent` IMMUTABLE con diccionario fijado; la decisión explícita de **no** endurecer el índice único con unaccent para no fallar la migración con datos vivos ("Bebé"/"Bebe"); `ON CONFLICT DO UPDATE` no-op (no `DO NOTHING`) precisamente para que `RETURNING` devuelva fila. Son sutilezas que suelen faltar.
7. **Rate limit por usuario en DB (CON-IA) > por IP en el proxy.** No bypasseable llamando al RPC directo. Mejora real de seguridad además de mover la capa.
8. **Evaluación de alternativas con criterio.** Los rechazos de `citext`, `pg_trgm` en write path, Realtime y trigger sobre `net._http_response` están bien argumentados.

---

## Debilidades priorizadas

### P0-1 · CON-IA · Máquina de estados sin control de concurrencia — **Alto**

`obtener_parseo` es **SECURITY DEFINER**, se **polea cada ~700ms** desde el cliente (y potencialmente desde varias pestañas / React StrictMode en dev) y, en el mismo cuerpo, **muta estado**: procesa la respuesta, y ante error de Anthropic dispara el fallback (`encolar_llamada_llm` de Gemini + `estado='procesando'`). El **janitor** de §4.4.6 hace exactamente lo mismo sobre las filas que "nadie polea". No hay ningún candado ni transición condicional.

**Riesgo concreto**: dos polls concurrentes (o poll + janitor) leen la misma fila en `procesando`, ambos ven el error de Anthropic y ambos encolan Gemini → **doble request al LLM (doble costo), dos `request_id` pisándose, y un estado final indeterminado**. El happy path también: dos polls que ven la respuesta 200 corren `validar_respuesta_parseo` + persistencia de resultado dos veces.

**Propuesta (compare-and-swap en cada transición).** Ninguna transición debe hacerse con `if estado = X then ... update`; debe hacerse con un `UPDATE ... WHERE estado = X RETURNING` que gana solo un ejecutor:

```sql
-- Tomar la fila para procesar: solo un ejecutor "gana" el procesamiento.
update parseos
   set estado = 'procesando'
 where id = p_id
   and estado in ('pendiente', 'procesando')
returning * into v_fila;
-- Si el disparo del fallback también es CAS:
update parseos
   set proveedor = 'gemini', estado = 'procesando', request_id = null
 where id = p_id
   and proveedor = 'anthropic'
   and estado = 'procesando'
returning * into v_fila;
if not found then
  -- otro ejecutor ya cambió el estado: releer y devolver, no re-encolar.
end if;
```

Alternativa equivalente: `select ... for update` al inicio de `obtener_parseo` y en el janitor con `skip locked`, serializando por fila. La spec debe **elegir una y escribirla**; hoy la sección no menciona concurrencia y el diseño la necesita porque el disparador es un poll de alta frecuencia con un janitor en paralelo. Sin esto, el fallback duplicado es cuestión de tiempo.

---

### P0-2 · Núcleo (ambas specs) · Canónico no determinístico en `marca_canonica`/`categoria_canonica` — **Alto**

Ambos helpers (SIN-IA §4.2, resumidos idénticos en CON-IA) hacen:

```sql
select coalesce(
  (select marca from producto_bases
   where tienda_id = p_tienda_id
     and forma_normalizada(marca) = forma_normalizada(p_marca)
   limit 1),               -- ← sin ORDER BY
  p_marca)
```

Si en la tienda ya coexisten dos capitalizaciones de la misma forma normalizada — que es **exactamente** el estado preexistente que motiva la feature ("MILEX" y "Milex" convivían porque antes no había canonicalización) — `limit 1` sin `order by` devuelve una fila **arbitraria**. El plan de Postgres puede cambiar el orden entre dos ejecuciones.

**Riesgo concreto**: (a) el "canónico" elegido **oscila** entre el preview (§4.4) y el write, o entre dos altas seguidas, produciendo justo la inconsistencia que la feature promete eliminar; (b) como la canonicalización de marca/categoría es **solo INSERT** y el backfill (P2-3) **no** dedupe las bases existentes, esas duplicadas quedan vivas y siguen siendo blanco arbitrario del lookup indefinidamente.

**Propuesta**: desempate determinístico explícito. La opción mínima es ordenar por antigüedad o alfabéticamente; la opción con mejor semántica es "la forma más frecuente gana":

```sql
-- Determinístico y con semántica de "mayoría": la capitalización más usada.
(select marca from producto_bases
  where tienda_id = p_tienda_id
    and forma_normalizada(marca) = forma_normalizada(p_marca)
    and marca is not null
  group by marca
  order by count(*) desc, marca asc   -- desempate estable final
  limit 1)
```

Cualquiera sirve mientras sea **total y estable**; `order by marca asc` solo ya elimina la no-determinación. Sin desempate, preview y write pueden divergir aun sin cambios en el catálogo, lo que contradice el objetivo central de ambas specs.

---

### P1-1 · CON-IA · El happy path depende de `net._http_response` — **Alto, sin arreglo limpio**

La Evaluación de alternativas **descarta** el trigger sobre `net._http_response` (opción 3) con un argumento correcto: es tabla interna (prefijo `_`), sin contrato de estabilidad, el worker de pg_net ha cambiado entre versiones cómo inserta/borra, con TTL de limpieza ~6h. Pero el diseño elegido igual **hace load-bearing esa misma tabla**: `obtener_parseo` lee `net._http_response where id = request_id` en el camino feliz. La distinción que la spec traza —"lectura puntual por id es el único uso aceptado"— es real pero delgada: un bump de pg_net que cambie *cuándo* aparece o *cuánto vive* la fila no rompe solo al janitor, rompe el happy path.

**Riesgo concreto**: la corrección funcional del flujo principal queda atada a un detalle de implementación de una extensión **en beta**. Es un riesgo de mantenimiento diferido: pasa CI hoy, se rompe en un upgrade de plataforma que nadie disparó desde el repo.

**No tiene arreglo limpio dentro del enfoque IA-en-DB.** No se puede leer la respuesta de pg_net sin tocar su tabla interna; envolverla en una vista propia no agrega estabilidad, solo indirección. Las mitigaciones honestas son: (a) fijar/verificar la versión de pg_net en cada deploy (ya está como pregunta abierta §9.1, subirla a precondición dura); (b) un test de integración que falle ruidosamente si el shape de `net._http_response` cambia, como canario. Ninguna elimina el acoplamiento. **Esto es, por sí solo, el argumento más fuerte a favor de la variante SIN-IA**; la spec CON-IA debería decir explícitamente "este acoplamiento no se puede eliminar, solo monitorear" en vez de dejarlo implícito entre el rechazo de la opción 3 y su uso en el happy path.

---

### P1-2 · SIN-IA · Garantía de preview sobredeclarada — **Medio-alto**

§4.4 afirma que la pantalla muestra "**literalmente lo que se guardará**" y que el RPC "elimina la clase entera de bugs 'confirmé una cosa y guardó otra'". Eso es cierto para la deriva de **lógica** (preview y write corren el mismo SQL — buen diseño), pero **no** para la deriva **temporal**: el preview se calcula en tiempo de parseo y la persistencia ocurre al confirmar. En una tienda multiusuario, entre esos dos momentos otro miembro puede insertar una base que cambie la reutilización o el canónico. `crear_producto_manual` re-evalúa contra el catálogo del momento del write y puede diferir de lo previsualizado.

**Riesgo concreto**: se promete una garantía absoluta ("literalmente") que el diseño no da; alguien confía en ella y no maneja el caso de divergencia. La ventana es chica pero existe justo en el escenario multiusuario que el repo acaba de habilitar (PR #101/#102).

**Propuesta**: (a) bajar la afirmación a "muestra lo que se guardaría con el catálogo al momento del preview"; y (b) cerrar el caso de verdad haciendo que `crear_producto_manual` **devuelva la fila normalizada final** (ya la devuelve: `jsonb_build_object('base', ..., 'variante', ...)`) y que la UI compare contra lo previsualizado y muestre un toast si difieren. No hace falta re-previsualizar; basta reconciliar con lo que el write efectivamente guardó.

---

### P1-3 · CON-IA · Contradicción entre plan de testing y §4.4.4 — **Medio**

El Plan de testing (punto 3) exige apuntar la URL del proveedor a "un endpoint de prueba controlable (la URL sale de una tabla de config o del secreto en Vault del entorno de test)". Pero §4.4.4 (`encolar_llamada_llm`) arma `net.http_post(url := v_url, ...)` sin especificar de dónde sale `v_url`; el resto de la sección sugiere URLs de proveedor hardcodeadas. Si la URL está fija en la función, **el plan de testing no es ejecutable** sin un cambio de diseño que la sección no compromete.

**Riesgo concreto**: se descubre en implementación que para testear hay que refactorizar la función que ya se creyó terminada; o peor, se testea contra el LLM real en CI (que la spec prohíbe explícitamente).

**Propuesta**: comprometer en §4.4.4 que la URL del proveedor es **configuración**, no literal — una tabla `config_parseo(proveedor, url_base)` o un secreto de Vault por entorno — y que `encolar_llamada_llm` la lee. Así el test redirige a un endpoint canned sin tocar código. Es una decisión de una línea que hoy queda ambigua.

---

### P2-1 · CON-IA · Zona muerta entre poll del cliente y janitor — **Medio**

El cliente polea "cada ~700ms con tope ~20s" (§4.4.2) pero el janitor marca `timeout` a los `creado_at < now() - interval '45 seconds'` (§4.4.6). Un LLM lento que responde entre 20 y 45s: el cliente ya se rindió (mostró timeout/error al usuario), la fila sigue `procesando`, y cuando llega la respuesta el janitor la puede resolver `ok` — resultado válido que el usuario nunca ve, o re-fallback innecesario.

**Riesgo concreto**: UX inconsistente en el borde (usuario ve error, la DB tiene éxito) y posible request de fallback desperdiciado. **Propuesta**: alinear los topes — tope de cliente ≥ timeout de janitor — o introducir un estado intermedio "sigue procesando, seguí esperando" en vez de rendirse a los 20s. Y hacer el janitor idempotente ante una respuesta que llegó tarde (cubierto si se aplica P0-1).

---

### P2-2 · Ambas · "§4.1–§4.3 idénticos" con fuente única en un solo documento — **Medio (proceso)**

CON-IA declara "Fuente canónica del SQL del núcleo: el documento hermano" y solo **resume** firma y decisiones; SIN-IA tiene el SQL completo. La afirmación de identidad byte-a-byte descansa en que nadie edite uno sin el otro.

**Riesgo concreto**: alguien corrige el SQL en SIN-IA (p. ej. aplica P0-2) y el resumen de CON-IA queda describiendo una versión que ya no existe. Deriva de documentación silenciosa, sin CI que la detecte.

**Propuesta**: extraer el núcleo a un tercer archivo (`SPEC-NORMALIZACION-DB-NUCLEO.md`) que ambas incluyan por referencia, o —mejor— tratar las migraciones `0016`–`0018` como la fuente única y que ambas specs linkeen a los archivos `.sql` reales en vez de transcribirlos. La duplicación de SQL entre specs no se sostiene en el tiempo.

---

### P2-3 · SIN-IA · El backfill no dedupe bases preexistentes — **Medio**

El backfill es `update producto_variantes set atributos = atributos`: dispara `limpiar_atributos` + `set_nombre_completo` sobre **variantes**, pero **no toca `producto_bases`**, y la canonicalización de marca/categoría es solo INSERT. Por diseño ("las ediciones son deliberadas"), correcto. Pero la consecuencia no está declarada: las bases duplicadas por capitalización que ya existen **siguen existiendo** tras la migración, y son la munición de la no-determinación de P0-2.

**Riesgo concreto**: se implementa la feature esperando que "MILEX"/"Milex" se consoliden y no pasa — solo las **altas nuevas** se canonicalizan; el estado sucio preexistente persiste. **Propuesta**: declararlo explícito en Riesgos y ofrecer (como paso operativo opcional, no migración automática) la query de detección ya presente en §9.1 más un procedimiento manual de merge de bases duplicadas. No inventar un merge automático: fusionar bases con variantes es destructivo y requiere criterio humano — decir eso es más honesto que prometer un backfill que limpie todo.

---

### P3 · Menores (bajo impacto, arreglo barato)

- **P3-1 · SIN-IA · Comentario RLS engañoso.** En `limpiar_atributos_variante` el comentario dice que el select "respeta RLS (misma tienda)", pero `sanear_atributos` lee `categoria_atributos`, cuya policy es `allow_all_anon using(true)` (`0008:72`) — sin scoping por tienda. La corrección la da el filtro explícito `where tienda_id = p_tienda_id`, no RLS. Ajustar el comentario para no atribuir a RLS una garantía que dan los parámetros; opcionalmente endurecer esa policy (concern aparte).
- **P3-2 · CON-IA · El rate limit cuenta errores.** `count(*) from parseos where creado_at > now() - interval '1 minute' >= 15` incluye filas en `error`/`timeout`. Una ráfaga de fallos del LLM bloquea al usuario un minuto sin que haya completado ninguno. Aceptable, pero declararlo; si molesta, contar solo estados no-error.
- **P3-3 · CON-IA · Estimación optimista.** 8–12 días no parece incluir el endurecimiento de concurrencia (P0-1), la infra de mock de proveedor (P1-3) ni los ciclos de verificación de versión de pg_net. SIN-IA (3–5 días) sí es creíble.
- **P3-4 · Ambas · Tests de concurrencia ausentes.** Ambas specs afirman cerrar el TOCTOU pero el plan de testing solo prueba "forzar fallo del insert", no dos inserts concurrentes del mismo EAN. El TOCTOU y (en CON-IA) las carreras de P0-1 quedan aseverados pero no cubiertos. Es difícil de testear, pero al menos anotarlo como límite conocido del plan.

---

## Cierre

Prioridad de acción: **P0-2 y P1-2 antes de aprobar el núcleo** (afectan a ambas specs y son baratos). Para elegir camino: **P1-1 es el factor decisivo** — si el equipo no está dispuesto a aceptar un acoplamiento permanente a la tabla interna de una extensión beta, SIN-IA es la recomendación, y CON-IA debería decirlo con esa crudeza. **P0-1 es bloqueante solo para CON-IA** pero es un hueco de diseño, no un detalle: sin CAS en las transiciones, el fallback duplicado no es hipotético. El resto refina; no cambia la decisión.
