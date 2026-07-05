-- Cierra la transición a atributos jsonb iniciada en 0008. Aplicar DESPUÉS
-- del deploy del código que escribe atributos: durante la ventana entre
-- 0008 y el deploy, los clientes viejos siguieron insertando en las
-- columnas legacy y dejaron atributos = '{}'. El re-backfill captura ese
-- delta (y el trigger de 0008 recomputa nombre_completo solo).

update producto_variantes
set atributos = atributos || jsonb_strip_nulls(jsonb_build_object(
  'tipo',   nullif(trim(tipo), ''),
  'sabor',  nullif(trim(sabor), ''),
  'tamano', nullif(trim(tamano), '')
))
where atributos = '{}'::jsonb
  and coalesce(nullif(trim(tipo), ''), nullif(trim(sabor), ''),
               nullif(trim(tamano), '')) is not null;

alter table producto_variantes
  drop column tipo,
  drop column sabor,
  drop column tamano;
