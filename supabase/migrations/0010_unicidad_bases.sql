-- Hardening post-limpieza del catálogo (jul 2026): la BD pasa a garantizar
-- lo que la limpieza dejó — una sola base por (nombre, marca) sin importar
-- mayúsculas ni espacios. El flujo de alta con IA ya matchea canónico; este
-- índice cierra el camino manual/Corregir, que podía recrear duplicados
-- ("MILEX" vs "Milex"). crearProductoManual busca la base existente con
-- ilike (case-insensitive) para reutilizar en vez de chocar con el índice.

-- 1. El trigger de normalización ahora también trimea nombre (el caso
--    "Ritz " vs "Ritz": dos bases distintas por un espacio al final).
create or replace function normalizar_marca_categoria()
returns trigger as $$
begin
  new.nombre = trim(new.nombre);
  new.marca = nullif(trim(new.marca), '');
  new.categoria = nullif(trim(new.categoria), '');
  return new;
end;
$$ language plpgsql set search_path = public;

-- Backfill del trim de nombre en filas existentes.
update producto_bases set nombre = trim(nombre) where nombre is distinct from trim(nombre);

-- 2. Unicidad case-insensitive de base por nombre+marca.
create unique index producto_bases_nombre_marca_uq
  on producto_bases (lower(trim(nombre)), lower(trim(coalesce(marca, ''))));
