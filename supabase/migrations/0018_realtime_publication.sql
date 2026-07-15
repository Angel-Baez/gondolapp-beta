-- Fase 4: colaboración en vivo (docs/SPECMULTIUSER.md §7). Suma las dos
-- tablas de listas activas a la publication de realtime para que el canal
-- postgres_changes las emita.
--
-- RLS aplica al canal con el token authenticated (setAuth en el cliente):
-- items_vencimiento se comparte a toda la tienda, e items_reposicion —
-- privada por usuario desde la 0017 — solo emite al propio dueño (útil en
-- multi-dispositivo con la misma cuenta). El filtro tienda_id=eq.X del
-- cliente acota además a la tienda activa.
--
-- El handler del cliente solo INVALIDA la query (nunca aplica el payload):
-- por eso alcanza con el evento, sin exponer old/new completos.
--
-- REPLICA IDENTITY FULL: sin esto, el evento DELETE solo trae la PK y el
-- filtro tienda_id=eq.X (y RLS) no puede evaluarse sobre la fila borrada,
-- así que los DELETE (retirar vencimiento, quitar pendiente) no llegarían.
-- Con FULL el old-record incluye todas las columnas. Costo de WAL menor:
-- son tablas de bajo volumen.

alter table items_reposicion replica identity full;
alter table items_vencimiento replica identity full;

-- Idempotente: en un stack recién creado por `supabase start`, la
-- publication existe pero sin estas tablas; el DO evita el error si ya
-- estuvieran (re-corridas, entornos distintos).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'items_reposicion'
  ) then
    alter publication supabase_realtime add table items_reposicion;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'items_vencimiento'
  ) then
    alter publication supabase_realtime add table items_vencimiento;
  end if;
end $$;
