"use client";

import { esRutaPublica } from "@/lib/rutasPublicas";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextValue {
  user: User | null;
  /** true mientras se resuelve la sesión inicial (lectura local, sin red). */
  cargando: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  cargando: true,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/**
 * Sesión de Supabase por contexto + gate client-side.
 *
 * El gate del proxy es best-effort (en arranque offline el SW sirve el
 * shell sin pasar por el Edge): este es el gate real de UX. getSession()
 * lee la cookie local sin red, así que con sesión local el shell offline
 * nunca se bloquea — aunque el access token esté vencido, las lecturas
 * salen del cache IDB y las escrituras van al outbox (spec §3.1).
 *
 * Va por fuera de QueryProvider: en la Fase 2 el buster del persister y
 * las query keys necesitan la identidad antes de montar los providers de
 * datos.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setUser(data.session?.user ?? null);
      setCargando(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUser(session?.user ?? null);
      setCargando(false);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (cargando || user) return;
    if (!esRutaPublica(pathname)) router.replace("/login");
  }, [cargando, user, pathname, router]);

  // Sin sesión en ruta protegida: no renderizar el contenido mientras el
  // redirect a /login está en vuelo (evita el flash de la app vacía).
  if (!cargando && !user && !esRutaPublica(pathname)) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}
