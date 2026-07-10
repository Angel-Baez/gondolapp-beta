-- Fase 1 multi-tienda (docs/SPECMULTIUSER.md §1.1, §1.4 y Roadmap):
-- tablas de organización, tienda inicial con UUID fijo, tienda_id en las 8
-- tablas de datos (DEFAULT + backfill + not null + índices) y RLS
-- intermedio: anon queda sin acceso, authenticated mantiene using(true)
-- hasta el scoping por tienda de la Fase 2.
--
-- ⚠️ Deploy coordinado (riesgo "corte de anon" de la spec): al aplicar esta
-- migración, toda PWA sin login recibe 401/403. El usuario real debe
-- loguearse y recargar la app el mismo día.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Tablas nuevas
-- ─────────────────────────────────────────────────────────────────────────

create table tiendas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) between 1 and 80),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_tiendas_updated_at
  before update on tiendas
  for each row
  execute function set_updated_at();

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
  codigo text not null unique,
  rol text not null default 'empleado' check (rol in ('admin', 'empleado')),
  creado_por uuid references auth.users(id) on delete set null,
  expira_at timestamptz not null default now() + interval '7 days',
  max_usos int not null default 1 check (max_usos > 0),
  usos int not null default 0,
  revocada boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_tienda_invitaciones_tienda_id on tienda_invitaciones (tienda_id);

-- RLS activo sin policies = acceso denegado para anon y authenticated.
-- Las policies reales (helpers mis_tiendas(), roles) llegan en la Fase 2;
-- hasta entonces, la única gestión es manual vía service_role/dashboard.
alter table tiendas enable row level security;
alter table tienda_miembros enable row level security;
alter table tienda_invitaciones enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Tienda inicial (UUID fijo, referenciado por los DEFAULT de abajo)
-- ─────────────────────────────────────────────────────────────────────────

insert into tiendas (id, nombre)
values ('a9defb27-54dd-4cb8-853f-2c901f8365dd', 'Mi Tienda');

-- ─────────────────────────────────────────────────────────────────────────
-- 3. tienda_id en las 8 tablas de datos: DEFAULT + backfill + not null.
--    El DEFAULT queda vigente durante TODA la Fase 1 porque en esta fase
--    ningún cliente envía tienda_id (el scoping y los triggers de
--    derivación llegan en la Fase 2, que además elimina el DEFAULT).
-- ─────────────────────────────────────────────────────────────────────────

alter table producto_bases
  add column tienda_id uuid references tiendas(id) on delete restrict
  default 'a9defb27-54dd-4cb8-853f-2c901f8365dd';
alter table producto_variantes
  add column tienda_id uuid references tiendas(id) on delete restrict
  default 'a9defb27-54dd-4cb8-853f-2c901f8365dd';
alter table categoria_atributos
  add column tienda_id uuid references tiendas(id) on delete restrict
  default 'a9defb27-54dd-4cb8-853f-2c901f8365dd';
alter table items_reposicion
  add column tienda_id uuid references tiendas(id) on delete restrict
  default 'a9defb27-54dd-4cb8-853f-2c901f8365dd';
alter table listas_reposicion_historial
  add column tienda_id uuid references tiendas(id) on delete restrict
  default 'a9defb27-54dd-4cb8-853f-2c901f8365dd';
alter table items_reposicion_historial
  add column tienda_id uuid references tiendas(id) on delete restrict
  default 'a9defb27-54dd-4cb8-853f-2c901f8365dd';
alter table items_vencimiento
  add column tienda_id uuid references tiendas(id) on delete restrict
  default 'a9defb27-54dd-4cb8-853f-2c901f8365dd';
alter table items_vencimiento_historial
  add column tienda_id uuid references tiendas(id) on delete restrict
  default 'a9defb27-54dd-4cb8-853f-2c901f8365dd';

-- Backfill explícito: ADD COLUMN con DEFAULT ya rellena las filas
-- existentes en Postgres moderno, pero el update es idempotente y deja la
-- intención auditable.
update producto_bases set tienda_id = 'a9defb27-54dd-4cb8-853f-2c901f8365dd' where tienda_id is null;
update producto_variantes set tienda_id = 'a9defb27-54dd-4cb8-853f-2c901f8365dd' where tienda_id is null;
update categoria_atributos set tienda_id = 'a9defb27-54dd-4cb8-853f-2c901f8365dd' where tienda_id is null;
update items_reposicion set tienda_id = 'a9defb27-54dd-4cb8-853f-2c901f8365dd' where tienda_id is null;
update listas_reposicion_historial set tienda_id = 'a9defb27-54dd-4cb8-853f-2c901f8365dd' where tienda_id is null;
update items_reposicion_historial set tienda_id = 'a9defb27-54dd-4cb8-853f-2c901f8365dd' where tienda_id is null;
update items_vencimiento set tienda_id = 'a9defb27-54dd-4cb8-853f-2c901f8365dd' where tienda_id is null;
update items_vencimiento_historial set tienda_id = 'a9defb27-54dd-4cb8-853f-2c901f8365dd' where tienda_id is null;

alter table producto_bases alter column tienda_id set not null;
alter table producto_variantes alter column tienda_id set not null;
alter table categoria_atributos alter column tienda_id set not null;
alter table items_reposicion alter column tienda_id set not null;
alter table listas_reposicion_historial alter column tienda_id set not null;
alter table items_reposicion_historial alter column tienda_id set not null;
alter table items_vencimiento alter column tienda_id set not null;
alter table items_vencimiento_historial alter column tienda_id set not null;

-- Índices de soporte para las policies por tienda (los compuestos de hot
-- paths llegan con el scoping real en la Fase 2).
create index idx_producto_bases_tienda_id on producto_bases (tienda_id);
create index idx_producto_variantes_tienda_id on producto_variantes (tienda_id);
create index idx_categoria_atributos_tienda_id on categoria_atributos (tienda_id);
create index idx_items_reposicion_tienda_id on items_reposicion (tienda_id);
create index idx_listas_reposicion_historial_tienda_id on listas_reposicion_historial (tienda_id);
create index idx_items_reposicion_historial_tienda_id on items_reposicion_historial (tienda_id);
create index idx_items_vencimiento_tienda_id on items_vencimiento (tienda_id);
create index idx_items_vencimiento_historial_tienda_id on items_vencimiento_historial (tienda_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. RLS intermedio: fuera anon, authenticated sigue con using(true).
--    Las 8 policies allow_all_anon: 7 de la migración 0002 + la de
--    categoria_atributos de la 0008 (§M7 del análisis: enumerar ambas).
-- ─────────────────────────────────────────────────────────────────────────

drop policy "allow_all_anon" on producto_bases;
drop policy "allow_all_anon" on producto_variantes;
drop policy "allow_all_anon" on categoria_atributos;
drop policy "allow_all_anon" on items_reposicion;
drop policy "allow_all_anon" on listas_reposicion_historial;
drop policy "allow_all_anon" on items_reposicion_historial;
drop policy "allow_all_anon" on items_vencimiento;
drop policy "allow_all_anon" on items_vencimiento_historial;

create policy "allow_all_authenticated" on producto_bases
  for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on producto_variantes
  for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on categoria_atributos
  for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on items_reposicion
  for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on listas_reposicion_historial
  for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on items_reposicion_historial
  for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on items_vencimiento
  for all to authenticated using (true) with check (true);
create policy "allow_all_authenticated" on items_vencimiento_historial
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Las 5 RPCs SECURITY DEFINER bypasean RLS, así que cortar anon en las
--    tablas no alcanza: sin este revoke, anon seguiría operando a través
--    de ellas. (Siguen siendo DEFINER hasta la conversión a INVOKER de la
--    Fase 2.) EXECUTE es por default de PUBLIC: hay que revocar ambos.
-- ─────────────────────────────────────────────────────────────────────────

revoke execute on function agregar_item_reposicion(uuid, integer) from public, anon;
revoke execute on function guardar_lista_reposicion() from public, anon;
revoke execute on function retirar_item_vencimiento(uuid) from public, anon;
revoke execute on function retirar_items_vencimiento(uuid[]) from public, anon;
revoke execute on function obtener_estadisticas_vencimiento(timestamptz, timestamptz) from public, anon;

grant execute on function agregar_item_reposicion(uuid, integer) to authenticated, service_role;
grant execute on function guardar_lista_reposicion() to authenticated, service_role;
grant execute on function retirar_item_vencimiento(uuid) to authenticated, service_role;
grant execute on function retirar_items_vencimiento(uuid[]) to authenticated, service_role;
grant execute on function obtener_estadisticas_vencimiento(timestamptz, timestamptz) to authenticated, service_role;

-- Post-deploy manual (spec §1.4): tras el primer login del usuario real,
--   insert into tienda_miembros (tienda_id, user_id, rol)
--   values ('a9defb27-54dd-4cb8-853f-2c901f8365dd', '<uid>', 'admin');
