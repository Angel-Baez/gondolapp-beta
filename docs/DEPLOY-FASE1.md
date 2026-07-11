# 🚀 Runbook: deploy coordinado de la Fase 1 (auth + corte de anon)

> Acompaña al PR de Fase 1 y a `supabase/migrations/0012_tiendas_y_backfill.sql`.
> **Por qué es coordinado**: al aplicar la 0012, toda PWA sin login recibe 401/403
> en todo (riesgo 🔴 de `SPECMULTIUSER.md`). El orden de este runbook hace que el
> teléfono de la tienda nunca vea ese corte.

## Resumen del orden (el porqué está en cada sección)

1. **Días antes** — Ensayo en staging (A) + configuración de Auth en el dashboard (B). Ninguno toca producción.
2. **Día D** — (C): backup → crear tu usuario → merge/deploy → actualizar la PWA del teléfono y loguearte **con la base todavía abierta** → aplicar la migración → alta de membresía → verificar.

Con ese orden, el teléfono ya está logueado cuando cae el corte de `anon`: cero downtime para la tienda.

---

## A. Ensayo en staging (días antes)

Objetivo: correr la 0012 contra una copia con **schema y datos reales** y ver que backfill, constraints y counts salen bien.

Prerequisitos: Docker, `supabase` CLI, y la connection string de producción (dashboard → Settings → Database).

```bash
# 1. Vincular el repo al proyecto (una sola vez)
supabase login
supabase link --project-ref <REF-DEL-PROYECTO>

# 2. Sacar la 0012 temporalmente para que el stack local quede en el estado
#    actual de producción (0001–0011)
mv supabase/migrations/0012_tiendas_y_backfill.sql /tmp/

# 3. Stack local con el schema de las migraciones 0001–0011
supabase start
supabase db reset

# 4. Traer los DATOS de producción y cargarlos en local
supabase db dump --linked --data-only -f /tmp/data-prod.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f /tmp/data-prod.sql

# 5. Restaurar la 0012 y aplicarla en una transacción (como hará el deploy real)
mv /tmp/0012_tiendas_y_backfill.sql supabase/migrations/
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  --single-transaction -f supabase/migrations/0012_tiendas_y_backfill.sql
```

**Verificar en el ensayo** (psql o Studio local, http://127.0.0.1:54323):

```sql
-- counts intactos vs producción (anotalos antes)
select count(*) from producto_variantes;
-- tienda_id completo en las 8 tablas
select count(*) from items_reposicion where tienda_id is null;  -- 0
-- la tienda inicial existe
select * from tiendas;
```

Y con la app: `.env.local` apuntando al stack local (`supabase status` imprime URL y anon key), crear un usuario en el Studio local (Authentication → Add user), `npm run dev`, login y operar las listas. `npm run test:integration` también corre contra este stack.

**Si no hay Docker disponible**: mismo ensayo contra un segundo proyecto gratuito de Supabase ("espejo"): restaurar ahí el dump completo (`supabase db dump --linked -f full.sql` + psql contra el espejo) y aplicar la 0012 encima.

## B. Configuración de Auth en el dashboard (días antes — no rompe nada)

En el proyecto de **producción**, dashboard → Authentication:

1. **Sign In / Up** → desactivar **"Allow new users to sign up"** (las cuentas de Fases 1–2 se crean a mano; se reactiva en Fase 3). Verificar que "Confirm email" quede **desactivado**.
2. **Sessions** → time-box y "inactivity timeout" **deshabilitados** (default). Una semana sin abrir la app no debe matar la sesión.
3. **URL Configuration** → Site URL: `https://gondolapp.digital`, y en **Redirect URLs** agregar `https://gondolapp.digital/restablecer` — sin esto, el enlace de recuperación de contraseña no vuelve a la app.
4. **SMTP custom (Resend)** — el built-in solo sirve para testing:
   - En Resend: agregar el dominio `gondolapp.digital`, cargar los registros DNS que pide (SPF/DKIM) y crear una API key.
   - En Supabase → Authentication → Emails → SMTP Settings: host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = la API key, sender `noreply@gondolapp.digital`.
   - Probar con un "Reset password" desde el dashboard a tu propio email.

## C. Día D (ventana de ~30 min, con la tienda tranquila)

> El free tier **no** tiene backups automáticos: el paso 1 no es opcional.

1. **Backup manual**: `supabase db dump --linked -f backup-pre-fase1.sql` (schema + datos). Guardarlo fuera del repo.
2. **Crear tu usuario real**: dashboard → Authentication → Users → Add user (email + contraseña, auto-confirm). Inofensivo: solo existe, no cambia nada.
3. **Merge del PR de Fase 1** → esperar el deploy de Vercel en verde. En este momento: los visitantes nuevos ven `/login`; la base sigue abierta como hoy, así que nada se rompe todavía.
4. **En el teléfono de la tienda**: abrir la PWA → aceptar el prompt "Nueva versión disponible → Actualizar ahora" (o cerrar y reabrir la app) → login con el usuario del paso 2 → verificar que las listas se ven. **No seguir hasta que este paso esté OK** — es lo que hace que el corte de anon no lo afecte.
5. **Aplicar la migración 0012 a producción** (transaccional; si falla, no queda nada a medias). Dos caminos:
   - SQL Editor del dashboard: pegar el contenido completo de `0012_tiendas_y_backfill.sql` y ejecutar; **o**
   - CLI: `supabase db push` — solo si `supabase migration list` muestra las 0001–0011 como aplicadas (si el historial de migraciones no está inicializado, usar el SQL Editor).
6. **Alta de membresía admin** (SQL Editor) — no la necesita la Fase 1 para operar (el RLS intermedio no mira membresías), pero deja todo listo para las Fases 2–3:

   ```sql
   insert into tienda_miembros (tienda_id, user_id, rol)
   select 'a9defb27-54dd-4cb8-853f-2c901f8365dd', id, 'admin'
   from auth.users
   where email = '<TU-EMAIL>';
   ```

7. **Verificación post-deploy**:

   ```bash
   # anon cortado en PostgREST (debe devolver [] o error, nunca datos)
   curl "https://<REF>.supabase.co/rest/v1/items_reposicion?select=id" \
     -H "apikey: <ANON-KEY>"
   # RPC cortada para anon (debe dar permission denied / 401)
   curl -X POST "https://<REF>.supabase.co/rest/v1/rpc/guardar_lista_reposicion" \
     -H "apikey: <ANON-KEY>" -H "Content-Type: application/json" -d '{}'
   ```

   En la app (logueado): escanear un producto, agregar a la lista, **crear un producto manual** (ejercita el gate 401 + cliente por-request), pedir un reset de contraseña (ejercita Resend), y modo avión → reabrir la PWA → las listas deben verse (arranque offline con sesión). En DevTools → Application → Cache Storage: no debe haber entradas de `*.supabase.co`.

## Rollback de emergencia

- **La app rota post-deploy, base sin migrar todavía** → "Instant Rollback" en Vercel y listo.
- **La app rota DESPUÉS de la migración** → revertir el deploy en Vercel **no alcanza**: el código viejo opera como `anon` y la base ya lo rechaza. Reabrir `anon` mientras se investiga:

  ```sql
  -- SOLO EMERGENCIA: restaura el acceso anon pre-0012 (dejar registrado y
  -- revertir en cuanto se resuelva)
  create policy "allow_all_anon" on producto_bases for all to anon using (true) with check (true);
  create policy "allow_all_anon" on producto_variantes for all to anon using (true) with check (true);
  create policy "allow_all_anon" on categoria_atributos for all to anon using (true) with check (true);
  create policy "allow_all_anon" on items_reposicion for all to anon using (true) with check (true);
  create policy "allow_all_anon" on listas_reposicion_historial for all to anon using (true) with check (true);
  create policy "allow_all_anon" on items_reposicion_historial for all to anon using (true) with check (true);
  create policy "allow_all_anon" on items_vencimiento for all to anon using (true) with check (true);
  create policy "allow_all_anon" on items_vencimiento_historial for all to anon using (true) with check (true);
  grant execute on function agregar_item_reposicion(uuid, integer) to anon;
  grant execute on function guardar_lista_reposicion() to anon;
  grant execute on function retirar_item_vencimiento(uuid) to anon;
  grant execute on function retirar_items_vencimiento(uuid[]) to anon;
  grant execute on function obtener_estadisticas_vencimiento(timestamptz, timestamptz) to anon;
  ```

  (Las columnas `tienda_id` y las tablas nuevas pueden quedar: el código viejo no las mira y los DEFAULT completan los inserts.)
