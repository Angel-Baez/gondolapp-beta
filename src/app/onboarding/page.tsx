"use client";

import {
  AuthCard,
  claseBotonPrimario,
  claseInput,
  MensajeError,
} from "@/components/auth/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import { useCerrarSesion } from "@/hooks/useCerrarSesion";
import { canjearInvitacion, crearTienda } from "@/services/equipo";
import { Loader2, Store, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Modo = "elegir" | "crear" | "codigo";

/**
 * Onboarding post-registro (Fase 3): una cuenta sin membresía no ve ningún
 * dato (RLS) — acá elige entre fundar su tienda o canjear el código que le
 * pasó un encargado. AuthProvider redirige a esta pantalla cuando detecta
 * sinTienda; al completar cualquiera de los dos caminos, refrescarMembresia
 * resuelve la tienda nueva y se vuelve a la app.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { user, cargando, tiendaActiva, sinTienda, refrescarMembresia } =
    useAuth();
  const { cerrarSesion, cerrando } = useCerrarSesion();
  const [modo, setModo] = useState<Modo>("elegir");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Con membresía esta pantalla no aplica (llegada por URL directa).
  useEffect(() => {
    if (!cargando && user && tiendaActiva && !sinTienda) {
      router.replace("/");
    }
  }, [cargando, user, tiendaActiva, sinTienda, router]);

  async function onCrear(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await crearTienda(nombre);
      await refrescarMembresia();
      router.replace("/");
    } catch (err) {
      setEnviando(false);
      setError(
        err instanceof Error ? err.message : "No se pudo crear la tienda"
      );
    }
  }

  async function onCanjear(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await canjearInvitacion(codigo);
      await refrescarMembresia();
      router.replace("/");
    } catch (err) {
      setEnviando(false);
      setError(
        err instanceof Error && /inválido|vencido|agotado/i.test(err.message)
          ? "Código inválido, vencido o agotado"
          : "No se pudo canjear el código. Probá de nuevo."
      );
    }
  }

  if (cargando) {
    return (
      <div className="min-h-dvh bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <AuthCard
      titulo="¡Ya casi!"
      subtitulo="Tu cuenta necesita una tienda para empezar"
    >
      {modo === "elegir" && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setError(null);
              setModo("crear");
            }}
            className="w-full p-4 rounded-2xl bg-surface-2 text-left flex items-center gap-3 hover:ring-2 hover:ring-accent transition-shadow"
          >
            <Store className="w-6 h-6 text-accent shrink-0" />
            <span>
              <span className="block font-semibold text-fg">
                Crear mi tienda
              </span>
              <span className="block text-sm text-fg-secondary">
                Arrancás de cero como encargado
              </span>
            </span>
          </button>
          <button
            onClick={() => {
              setError(null);
              setModo("codigo");
            }}
            className="w-full p-4 rounded-2xl bg-surface-2 text-left flex items-center gap-3 hover:ring-2 hover:ring-accent transition-shadow"
          >
            <Ticket className="w-6 h-6 text-accent shrink-0" />
            <span>
              <span className="block font-semibold text-fg">
                Tengo un código
              </span>
              <span className="block text-sm text-fg-secondary">
                Te invitaron a una tienda existente
              </span>
            </span>
          </button>
        </div>
      )}

      {modo === "crear" && (
        <form onSubmit={onCrear} className="space-y-3">
          <input
            type="text"
            required
            maxLength={80}
            placeholder="Nombre de la tienda"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={claseInput}
            autoFocus
          />
          <MensajeError mensaje={error} />
          <button
            type="submit"
            disabled={enviando || nombre.trim().length === 0}
            className={claseBotonPrimario}
          >
            {enviando ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Crear tienda"
            )}
          </button>
          <button
            type="button"
            onClick={() => setModo("elegir")}
            className="w-full text-sm text-fg-secondary"
          >
            Volver
          </button>
        </form>
      )}

      {modo === "codigo" && (
        <form onSubmit={onCanjear} className="space-y-3">
          <input
            type="text"
            required
            maxLength={8}
            placeholder="Código de invitación"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            className={`${claseInput} uppercase tracking-widest text-center font-mono`}
            autoFocus
          />
          <MensajeError mensaje={error} />
          <button
            type="submit"
            disabled={enviando || codigo.trim().length === 0}
            className={claseBotonPrimario}
          >
            {enviando ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Unirme a la tienda"
            )}
          </button>
          <button
            type="button"
            onClick={() => setModo("elegir")}
            className="w-full text-sm text-fg-secondary"
          >
            Volver
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={cerrarSesion}
          disabled={cerrando}
          className="text-sm text-fg-tertiary underline-offset-2 hover:underline"
        >
          {user?.email ? `Salir de ${user.email}` : "Cerrar sesión"}
        </button>
      </div>
    </AuthCard>
  );
}
