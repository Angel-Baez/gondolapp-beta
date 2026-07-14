"use client";

import { setUsuarioOutbox } from "@/lib/outbox/outbox";
import { esRutaPublica } from "@/lib/rutasPublicas";
import { supabase } from "@/lib/supabase";
import { RolTienda, useSesionStore } from "@/store/sesion";
import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextValue {
  user: User | null;
  /** true mientras se resuelve la sesión inicial (lectura local, sin red). */
  cargando: boolean;
  /** Tienda activa del usuario (única membresía en el caso típico). En
   * arranque offline sale del valor persistido; online se reconcilia contra
   * tienda_miembros. */
  tiendaActiva: string | null;
  rol: RolTienda | null;
  /** true solo cuando la membresía se consultó ONLINE y vino vacía: el
   * usuario está logueado pero no pertenece a ninguna tienda (cuenta nueva
   * o expulsado). Un fetch fallido (offline) NO lo activa. */
  sinTienda: boolean;
  /** Re-consulta tienda_miembros (post crear tienda / canjear código /
   * salir de la tienda). */
  refrescarMembresia: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  cargando: true,
  tiendaActiva: null,
  rol: null,
  sinTienda: false,
  refrescarMembresia: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/**
 * Sesión de Supabase por contexto + gate client-side + tienda activa.
 *
 * El gate del proxy es best-effort (en arranque offline el SW sirve el
 * shell sin pasar por el Edge): este es el gate real de UX. getSession()
 * lee la cookie local sin red, así que con sesión local el shell offline
 * nunca se bloquea — aunque el access token esté vencido, las lecturas
 * salen del cache IDB y las escrituras van al outbox (spec §3.1).
 *
 * Va por fuera de QueryProvider: el buster del persister y las query keys
 * dependen de la identidad (user + tienda activa) antes de montar los
 * providers de datos.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  // Arranque con el valor persistido: offline es la única fuente posible.
  const [tiendaActiva, setTiendaActiva] = useState<string | null>(
    () => useSesionStore.getState().tiendaActivaId
  );
  const [rol, setRol] = useState<RolTienda | null>(
    () => useSesionStore.getState().rol
  );
  const [sinTienda, setSinTienda] = useState(false);
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

  const refrescarMembresia = useCallback(async () => {
    const { data, error } = await supabase
      .from("tienda_miembros")
      .select("tienda_id, rol");
    // Error (típicamente red/offline): conservar el estado persistido y no
    // declarar "sin tienda" — el cache local sigue siendo operable.
    if (error || !data) return;
    const persistida = useSesionStore.getState().tiendaActivaId;
    const elegida =
      data.find((m) => m.tienda_id === persistida) ?? data[0] ?? null;
    const tiendaId = elegida?.tienda_id ?? null;
    const rolElegido = (elegida?.rol as RolTienda | undefined) ?? null;
    setTiendaActiva(tiendaId);
    setRol(rolElegido);
    setSinTienda(data.length === 0);
    useSesionStore.getState().setTienda(tiendaId, rolElegido);
  }, []);

  // Resolver la membresía cuando hay usuario; sin red queda el persistido.
  useEffect(() => {
    setUsuarioOutbox(user?.id ?? null);
    if (!user) {
      setTiendaActiva(null);
      setRol(null);
      setSinTienda(false);
      return;
    }
    refrescarMembresia();
  }, [user, refrescarMembresia]);

  useEffect(() => {
    if (cargando || user) return;
    if (!esRutaPublica(pathname)) router.replace("/login");
  }, [cargando, user, pathname, router]);

  // Cuenta sin membresía en ruta protegida → onboarding (crear tienda o
  // canjear código). /unirse es pública y queda fuera: quien llega por un
  // link de invitación canjea ahí mismo.
  useEffect(() => {
    if (cargando || !user || !sinTienda) return;
    if (!esRutaPublica(pathname) && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [cargando, user, sinTienda, pathname, router]);

  // Sin sesión en ruta protegida: no renderizar el contenido mientras el
  // redirect a /login está en vuelo (evita el flash de la app vacía).
  if (!cargando && !user && !esRutaPublica(pathname)) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ user, cargando, tiendaActiva, rol, sinTienda, refrescarMembresia }}
    >
      {children}
    </AuthContext.Provider>
  );
}
