-- Habilita RLS en las 7 tablas con una policy permisiva para anon/authenticated.
-- La app no tiene sistema de login (single-user/single-device por diseño), asi
-- que esto no restringe el comportamiento actual: solo formaliza el acceso via
-- RLS en vez de dejarlo completamente abierto sin RLS. Si en el futuro se agrega
-- auth, estas policies son el punto de partida para reemplazar por reglas reales
-- (ej. filtrar por usuario_id).

ALTER TABLE public.producto_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_reposicion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listas_reposicion_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_reposicion_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_vencimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_vencimiento_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_anon" ON public.producto_bases FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon" ON public.producto_variantes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon" ON public.items_reposicion FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon" ON public.listas_reposicion_historial FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon" ON public.items_reposicion_historial FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon" ON public.items_vencimiento FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_anon" ON public.items_vencimiento_historial FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
