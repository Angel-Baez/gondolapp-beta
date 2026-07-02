-- GondolApp: esquema inicial (redisenio, fuente unica de verdad en Postgres)
-- Reemplaza el par MongoDB (catalogo remoto) + IndexedDB (items/historial locales).

create extension if not exists pgcrypto;

-- ============================================
-- CATALOGO (compartido por ambas features)
-- ============================================

create table producto_bases (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  marca text,
  categoria text,
  imagen text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table producto_variantes (
  id uuid primary key default gen_random_uuid(),
  producto_base_id uuid not null references producto_bases(id) on delete cascade,
  codigo_barras text not null unique,
  nombre_completo text not null,
  tipo text,
  tamano text,
  sabor text,
  created_at timestamptz not null default now()
);

create index idx_producto_variantes_codigo_barras on producto_variantes (codigo_barras);
create index idx_producto_variantes_producto_base_id on producto_variantes (producto_base_id);

-- ============================================
-- REPOSICION
-- ============================================

create type estado_reposicion as enum ('pendiente', 'repuesto', 'sin_stock');

create table items_reposicion (
  id uuid primary key default gen_random_uuid(),
  variante_id uuid not null references producto_variantes(id) on delete restrict,
  cantidad int not null check (cantidad > 0),
  estado estado_reposicion not null default 'pendiente',
  agregado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create index idx_items_reposicion_variante_id on items_reposicion (variante_id);
create index idx_items_reposicion_estado on items_reposicion (estado);

create table listas_reposicion_historial (
  id uuid primary key default gen_random_uuid(),
  fecha_creacion timestamptz not null,
  fecha_guardado timestamptz not null default now(),
  total_productos int not null,
  total_repuestos int not null,
  total_sin_stock int not null,
  total_pendientes int not null,
  duracion_minutos int,
  ubicacion text
);

create index idx_listas_reposicion_historial_fecha_guardado on listas_reposicion_historial (fecha_guardado desc);

create table items_reposicion_historial (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid not null references listas_reposicion_historial(id) on delete cascade,
  variante_id uuid references producto_variantes(id) on delete set null,
  producto_nombre text not null,
  producto_marca text,
  variante_nombre text not null,
  cantidad int not null,
  estado estado_reposicion not null
);

create index idx_items_reposicion_historial_lista_id on items_reposicion_historial (lista_id);

-- ============================================
-- VENCIMIENTO
-- ============================================

-- estado solo distingue "activo en la lista" vs "retirado"; la urgencia
-- (incluyendo si ya vencio sin retirarse) se deriva de fecha_vencimiento
-- al leer, no se persiste (ver src/lib/utils.ts calcularNivelAlerta).
create type estado_vencimiento as enum ('pendiente', 'retirado');

create table items_vencimiento (
  id uuid primary key default gen_random_uuid(),
  variante_id uuid not null references producto_variantes(id) on delete restrict,
  fecha_vencimiento date not null,
  cantidad int,
  lote text,
  estado estado_vencimiento not null default 'pendiente',
  agregado_at timestamptz not null default now(),
  resuelto_at timestamptz
);

create index idx_items_vencimiento_variante_id on items_vencimiento (variante_id);
create index idx_items_vencimiento_estado_fecha on items_vencimiento (estado, fecha_vencimiento);

create table items_vencimiento_historial (
  id uuid primary key default gen_random_uuid(),
  variante_id uuid references producto_variantes(id) on delete set null,
  producto_nombre text not null,
  producto_marca text,
  variante_nombre text not null,
  cantidad int,
  lote text,
  fecha_vencimiento date not null,
  fecha_retiro timestamptz not null default now(),
  nivel_alerta_al_retirar text not null
);

create index idx_items_vencimiento_historial_fecha_retiro on items_vencimiento_historial (fecha_retiro desc);

-- ============================================
-- updated_at automatico en producto_bases
-- ============================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_producto_bases_updated_at
  before update on producto_bases
  for each row
  execute function set_updated_at();
