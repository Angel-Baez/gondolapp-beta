# Runbook operativo — multi-tienda

Operación día a día del sistema multi-tienda (Fases 1–4 de
`docs/SPECMULTIUSER.md`). Para el detalle del deploy coordinado de la Fase 1
ver `docs/DEPLOY-FASE1.md`; este doc cubre la operación una vez que todo
está en producción.

Proyectos Supabase:
- **Producción**: `naccvajxoxosdmehvgnk`
- **Espejo/staging**: `zjoptonaowtcsfgdfgfb` (para ensayar migraciones y correr
  la verificación de aislamiento por SQL antes de tocar producción).

---

## Modelo de acceso (resumen)

- **Tienda**: unidad de aislamiento. Todo dato (`producto_bases`,
  `producto_variantes`, `items_*`, historial, `categoria_atributos`) lleva
  `tienda_id` y está protegido por RLS por membresía.
- **Membresía** (`tienda_miembros`): un usuario pertenece a ≥1 tienda con rol
  `admin` o `empleado`.
- **Perfil** (`perfiles`): nombre visible del usuario, para atribuir listas e
  items. Se crea solo al registrarse.
- **Roles**:
  - *Empleado*: opera reposición (lista **privada** por usuario) y
    vencimientos (compartidos), ve el catálogo y el historial.
  - *Admin*: además renombra la tienda, gestiona el equipo y las
    invitaciones, borra historial y catálogo, y gestiona
    `categoria_atributos`.
- **Invariante "último admin"**: una tienda nunca puede quedarse sin admin
  (trigger `proteger_ultimo_admin`).

---

## Tareas frecuentes

### Sumar un empleado a la tienda
Se hace **desde la app**, sin tocar el dashboard:
1. Un admin entra a **/tienda → Generar código** (elige rol y cantidad de
   usos; vence a los 7 días) y comparte el código o el link
   `/unirse?codigo=XXXX`.
2. El nuevo usuario abre el link, crea su cuenta (con su nombre) y queda
   dentro. Si ya tenía cuenta, la usa.
3. Revocar un código: **/tienda**, botón ✕ sobre el código.

### Cambiar el rol o expulsar a alguien
**/tienda → Equipo**: "Hacer admin / Hacer empleado" o el ícono de quitar.
La expulsión corta el acceso **en el próximo request online** del expulsado;
su copia local ya descargada no es revocable (limitación aceptada del
offline-first, ver spec §"Limitaciones declaradas").

### Alta manual de un usuario (excepcional)
Solo si hace falta crear una cuenta sin signup público. Dashboard →
Authentication → Add user; después, para darle membresía admin de la tienda
inicial:
```sql
insert into tienda_miembros (tienda_id, user_id, rol)
values ('<tienda_id>', '<user_id>', 'admin');
```
El perfil se crea solo por el trigger `trg_crear_perfil_de_usuario` (nombre
derivado del email; el usuario lo edita en /perfil).

### Crear una tienda nueva
Se autogestiona: una cuenta nueva sin membresía cae en `/onboarding` y elige
"Crear mi tienda" (RPC `crear_tienda_con_admin`, queda como admin).

---

## Deploy de una migración

1. Escribir `supabase/migrations/00NN_*.sql`.
2. **Ensayo en el espejo** vía MCP `apply_migration` (proyecto
   `zjoptonaowtcsfgdfgfb`); correr la verificación de aislamiento por SQL
   (impersonando usuarios con `set_config('request.jwt.claims', …)` +
   `set role authenticated`), mirroring de `src/tests/integration/aislamiento-rls.test.ts`.
3. Correr `get_advisors` (security) en el espejo.
4. Aplicar la misma migración a **producción** y, si el cliente depende de
   ella, mergear el PR para disparar el deploy de Vercel.

**Orden migración ↔ deploy** (crítico en las fases con cambios de firma):
- **Cambios de firma de RPC** (Fase 2): migración y deploy **juntos**, en una
  ventana corta con la tienda tranquila (las firmas cruzadas son
  incompatibles en ambos sentidos).
- **Cambios aditivos** (columnas nuevas con default, tablas nuevas, RPC
  nuevas — Fases 3, 3.1, 4): aplicar la **migración primero**, después el
  deploy. El cliente viejo convive con las columnas nuevas.

---

## Rollback de emergencia

- **Cliente**: `vercel rollback` (o "Promote" del deployment previo en el
  dashboard) — restaura la versión anterior en segundos.
- **Migración**: no hay `down` automático. Para revertir, escribir la
  migración inversa. El caso más delicado ya deployado y con runbook propio
  es el corte de `anon` de la Fase 1 (recrear `allow_all_anon` + re-grant de
  las RPCs a `anon`): ver `docs/DEPLOY-FASE1.md`.

---

## Colaboración en vivo (Fase 4)

- Las listas activas refetchean al volver el foco a la pestaña y cada 30 s
  (solo con la pestaña visible).
- Un canal `postgres_changes` por tienda (`RealtimeProvider`) invalida las
  listas cuando cambian en el server: vencimientos se propagan a toda la
  tienda; reposición —privada— solo entre dispositivos de la misma cuenta.
- La publication `supabase_realtime` incluye `items_reposicion` e
  `items_vencimiento` (migración 0018) y ambas tienen `REPLICA IDENTITY FULL`
  (necesario para que los eventos DELETE lleguen con `tienda_id`).
- Si el realtime se cae, el refetch por foco/intervalo es el fallback: la
  colaboración degrada a "hasta 30 s", no se rompe.

---

## Chequeos de salud

- **Advisors de seguridad** (dashboard o MCP `get_advisors`): tras cada
  migración. Los WARN esperados son las funciones `SECURITY DEFINER` con
  guard interno (`crear_tienda_con_admin`, `canjear_invitacion`,
  `generar_codigo_invitacion`, `mis_tiendas*`, `mis_companeros`,
  `miembros_de_tienda`) y "Leaked Password Protection" si se desactivara.
- **Sin filas sin `tienda_id`/`agregado_por`**: no debería haber (columnas
  `not null`); si aparecen tras un import manual, backfillear antes de que la
  RLS las vuelva invisibles.
- **Signups públicos**: habilitados desde la Fase 3 (Authentication → Sign
  In / Providers). Una cuenta nueva sin membresía no ve ningún dato y cae en
  el onboarding.
