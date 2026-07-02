-- Fija el search_path de la función de trigger para evitar el warning de
-- seguridad "function_search_path_mutable" del linter de Supabase.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;
