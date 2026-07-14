-- Fase 2 multi-tienda (2/3): RLS real por membresía (docs/SPECMULTIUSER.md
-- §2.1, §2.2). Reemplaza el RLS intermedio de la Fase 1 (allow_all para
-- authenticated) por policies por tienda en las 11 tablas.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Helpers SECURITY DEFINER (§2.1). Evitan la recursión en las policies
--    de tienda_miembros y unifican el patrón. La forma
--    `col in (select mis_tiendas())` se evalúa una vez por statement
--    (InitPlan); auth.uid() va envuelto en (select ...) por el mismo motivo.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.mis_tiendas() returns setof uuid
language sql stable security definer set search_path = public as
$$ select tienda_id from tienda_miembros where user_id = (select auth.uid()) $$;

create or replace function public.mis_tiendas_admin() returns setof uuid
language sql stable security definer set search_path = public as
$$ select tienda_id from tienda_miembros where user_id = (select auth.uid()) and rol = 'admin' $$;

revoke execute on function mis_tiendas() from public, anon;
revoke execute on function mis_tiendas_admin() from public, anon;
grant execute on function mis_tiendas() to authenticated, service_role;
grant execute on function mis_tiendas_admin() to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Fuera el RLS intermedio de la Fase 1
-- ─────────────────────────────────────────────────────────────────────────

drop policy "allow_all_authenticated" on producto_bases;
drop policy "allow_all_authenticated" on producto_variantes;
drop policy "allow_all_authenticated" on categoria_atributos;
drop policy "allow_all_authenticated" on items_reposicion;
drop policy "allow_all_authenticated" on listas_reposicion_historial;
drop policy "allow_all_authenticated" on items_reposicion_historial;
drop policy "allow_all_authenticated" on items_vencimiento;
drop policy "allow_all_authenticated" on items_vencimiento_historial;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Tablas de organización (§2.2)
-- ─────────────────────────────────────────────────────────────────────────

create policy "tiendas_select_miembros" on tiendas
  for select to authenticated
  using (id in (select mis_tiendas()));
create policy "tiendas_update_admin" on tiendas
  for update to authenticated
  using (id in (select mis_tiendas_admin()))
  with check (id in (select mis_tiendas_admin()));
-- INSERT solo vía crear_tienda_con_admin (definer); DELETE fuera de scope.

create policy "tienda_miembros_select_miembros" on tienda_miembros
  for select to authenticated
  using (tienda_id in (select mis_tiendas()));
create policy "tienda_miembros_update_admin" on tienda_miembros
  for update to authenticated
  using (tienda_id in (select mis_tiendas_admin()))
  with check (tienda_id in (select mis_tiendas_admin()));
create policy "tienda_miembros_delete_admin_o_propio" on tienda_miembros
  for delete to authenticated
  using (
    tienda_id in (select mis_tiendas_admin())
    or user_id = (select auth.uid())
  );
-- INSERT solo vía crear_tienda_con_admin / canjear_invitacion (definer).

create policy "tienda_invitaciones_select_admin" on tienda_invitaciones
  for select to authenticated
  using (tienda_id in (select mis_tiendas_admin()));
create policy "tienda_invitaciones_insert_admin" on tienda_invitaciones
  for insert to authenticated
  with check (tienda_id in (select mis_tiendas_admin()));
create policy "tienda_invitaciones_update_admin" on tienda_invitaciones
  for update to authenticated
  using (tienda_id in (select mis_tiendas_admin()))
  with check (tienda_id in (select mis_tiendas_admin()));
create policy "tienda_invitaciones_delete_admin" on tienda_invitaciones
  for delete to authenticated
  using (tienda_id in (select mis_tiendas_admin()));

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Catálogo: miembros operan; borrar es de admin
-- ─────────────────────────────────────────────────────────────────────────

create policy "producto_bases_select_miembros" on producto_bases
  for select to authenticated using (tienda_id in (select mis_tiendas()));
create policy "producto_bases_insert_miembros" on producto_bases
  for insert to authenticated with check (tienda_id in (select mis_tiendas()));
create policy "producto_bases_update_miembros" on producto_bases
  for update to authenticated
  using (tienda_id in (select mis_tiendas()))
  with check (tienda_id in (select mis_tiendas()));
create policy "producto_bases_delete_admin" on producto_bases
  for delete to authenticated using (tienda_id in (select mis_tiendas_admin()));

create policy "producto_variantes_select_miembros" on producto_variantes
  for select to authenticated using (tienda_id in (select mis_tiendas()));
create policy "producto_variantes_insert_miembros" on producto_variantes
  for insert to authenticated with check (tienda_id in (select mis_tiendas()));
create policy "producto_variantes_update_miembros" on producto_variantes
  for update to authenticated
  using (tienda_id in (select mis_tiendas()))
  with check (tienda_id in (select mis_tiendas()));
create policy "producto_variantes_delete_admin" on producto_variantes
  for delete to authenticated using (tienda_id in (select mis_tiendas_admin()));

-- Definiciones de atributos: leer es de miembros, gestionarlas es de admin.
create policy "categoria_atributos_select_miembros" on categoria_atributos
  for select to authenticated using (tienda_id in (select mis_tiendas()));
create policy "categoria_atributos_insert_admin" on categoria_atributos
  for insert to authenticated with check (tienda_id in (select mis_tiendas_admin()));
create policy "categoria_atributos_update_admin" on categoria_atributos
  for update to authenticated
  using (tienda_id in (select mis_tiendas_admin()))
  with check (tienda_id in (select mis_tiendas_admin()));
create policy "categoria_atributos_delete_admin" on categoria_atributos
  for delete to authenticated using (tienda_id in (select mis_tiendas_admin()));

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Listas activas: operación plena de miembros
-- ─────────────────────────────────────────────────────────────────────────

create policy "items_reposicion_select_miembros" on items_reposicion
  for select to authenticated using (tienda_id in (select mis_tiendas()));
create policy "items_reposicion_insert_miembros" on items_reposicion
  for insert to authenticated with check (tienda_id in (select mis_tiendas()));
create policy "items_reposicion_update_miembros" on items_reposicion
  for update to authenticated
  using (tienda_id in (select mis_tiendas()))
  with check (tienda_id in (select mis_tiendas()));
create policy "items_reposicion_delete_miembros" on items_reposicion
  for delete to authenticated using (tienda_id in (select mis_tiendas()));

create policy "items_vencimiento_select_miembros" on items_vencimiento
  for select to authenticated using (tienda_id in (select mis_tiendas()));
create policy "items_vencimiento_insert_miembros" on items_vencimiento
  for insert to authenticated with check (tienda_id in (select mis_tiendas()));
create policy "items_vencimiento_update_miembros" on items_vencimiento
  for update to authenticated
  using (tienda_id in (select mis_tiendas()))
  with check (tienda_id in (select mis_tiendas()));
create policy "items_vencimiento_delete_miembros" on items_vencimiento
  for delete to authenticated using (tienda_id in (select mis_tiendas()));

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Historial: es el registro de auditoría del trabajo hecho — un
--    empleado no puede borrar evidencia (delete solo admin) y nadie edita
--    (sin policy de UPDATE). El INSERT de miembros lo necesitan las RPCs
--    invoker de la 0015.
-- ─────────────────────────────────────────────────────────────────────────

create policy "listas_reposicion_historial_select_miembros" on listas_reposicion_historial
  for select to authenticated using (tienda_id in (select mis_tiendas()));
create policy "listas_reposicion_historial_insert_miembros" on listas_reposicion_historial
  for insert to authenticated with check (tienda_id in (select mis_tiendas()));
create policy "listas_reposicion_historial_delete_admin" on listas_reposicion_historial
  for delete to authenticated using (tienda_id in (select mis_tiendas_admin()));

create policy "items_reposicion_historial_select_miembros" on items_reposicion_historial
  for select to authenticated using (tienda_id in (select mis_tiendas()));
create policy "items_reposicion_historial_insert_miembros" on items_reposicion_historial
  for insert to authenticated with check (tienda_id in (select mis_tiendas()));
create policy "items_reposicion_historial_delete_admin" on items_reposicion_historial
  for delete to authenticated using (tienda_id in (select mis_tiendas_admin()));

create policy "items_vencimiento_historial_select_miembros" on items_vencimiento_historial
  for select to authenticated using (tienda_id in (select mis_tiendas()));
create policy "items_vencimiento_historial_insert_miembros" on items_vencimiento_historial
  for insert to authenticated with check (tienda_id in (select mis_tiendas()));
create policy "items_vencimiento_historial_delete_admin" on items_vencimiento_historial
  for delete to authenticated using (tienda_id in (select mis_tiendas_admin()));
