-- Fase 3 multi-tienda: gestión de equipo (docs/SPECMULTIUSER.md §3.3 y
-- Roadmap Fase 3). Dos piezas de DB que la UI de /tienda necesita:
--
-- 1. Guard "último admin": una tienda nunca puede quedarse sin admin, ni
--    por degradación de rol ni por expulsión/salida. Las policies de 0014
--    ya permiten a un admin cambiar roles y borrar membresías (y a
--    cualquiera borrar la propia); este trigger agrega el invariante que
--    ninguna policy puede expresar (mira OTRAS filas de la tabla).
--
-- 2. miembros_de_tienda(): la lista de miembros con email. Los emails
--    viven en auth.users, que el cliente no puede leer; la RPC es DEFINER
--    con guard de membresía interno (regla de 0015: el guard que la policy
--    no aplica va DENTRO de la función, con su revoke en la misma
--    migración).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Guard último admin
-- ─────────────────────────────────────────────────────────────────────────

-- Corre como invoker: los SELECT ven la tienda vía RLS porque quien
-- dispara el trigger es siempre miembro (policies de UPDATE/DELETE de
-- tienda_miembros). Si la tienda ya no existe (cascada de un borrado
-- administrativo de tiendas vía service_role), el guard deja pasar.
-- Nota aceptada: borrar de auth.users al único admin de una tienda viva
-- también dispara la cascada y es bloqueado — es el mismo invariante
-- (primero se transfiere la tienda o se borra la tienda, después el user).
create or replace function proteger_ultimo_admin() returns trigger
language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from tiendas where id = old.tienda_id) then
    return coalesce(new, old);
  end if;

  if old.rol = 'admin'
     and (tg_op = 'DELETE' or new.rol <> 'admin')
     and not exists (
       select 1 from tienda_miembros
       where tienda_id = old.tienda_id
         and rol = 'admin'
         and user_id <> old.user_id
     ) then
    raise exception 'La tienda no puede quedarse sin admin';
  end if;

  return coalesce(new, old);
end; $$;

create trigger trg_tienda_miembros_ultimo_admin
  before update or delete on tienda_miembros
  for each row execute function proteger_ultimo_admin();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Lista de miembros con email
-- ─────────────────────────────────────────────────────────────────────────

-- Un no-miembro recibe 0 filas (el guard está en el WHERE): suficiente
-- para la UI y no filtra ni la existencia de la tienda.
create function miembros_de_tienda(p_tienda_id uuid)
returns table (user_id uuid, email text, rol text, creado_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select tm.user_id, u.email::text, tm.rol, tm.created_at
  from tienda_miembros tm
  join auth.users u on u.id = tm.user_id
  where tm.tienda_id = p_tienda_id
    and p_tienda_id in (
      select tienda_id from tienda_miembros
      where tienda_miembros.user_id = (select auth.uid())
    )
  order by tm.created_at;
$$;

revoke execute on function miembros_de_tienda(uuid) from public, anon;
grant execute on function miembros_de_tienda(uuid) to authenticated, service_role;
