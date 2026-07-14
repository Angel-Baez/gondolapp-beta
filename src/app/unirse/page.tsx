"use client";

import {
  AuthCard,
  claseBotonPrimario,
  claseInput,
  MensajeError,
} from "@/components/auth/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import { canjearInvitacion } from "@/services/equipo";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

/**
 * Destino del link de invitación (/unirse?codigo=X, spec §1.1): pública
 * porque el invitado típico todavía no tiene cuenta. Deslogueado ofrece
 * registro/login con next= de vuelta acá; logueado canjea directo (sirve
 * también para sumar una segunda tienda a una cuenta existente).
 */
function UnirseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, cargando, refrescarMembresia } = useAuth();
  const [codigo, setCodigo] = useState(
    () => searchParams.get("codigo")?.toUpperCase() ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const next = `/unirse?codigo=${encodeURIComponent(codigo)}`;

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

  if (!user) {
    return (
      <AuthCard
        titulo="Te invitaron a una tienda"
        subtitulo="Creá tu cuenta o entrá para sumarte"
      >
        {codigo && (
          <p className="text-center font-mono text-2xl tracking-widest text-fg mb-4">
            {codigo}
          </p>
        )}
        <div className="space-y-3">
          <Link
            href={`/registro?next=${encodeURIComponent(next)}`}
            className={`${claseBotonPrimario} flex items-center justify-center`}
          >
            Crear cuenta
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="w-full h-12 rounded-full bg-surface-2 text-fg font-semibold flex items-center justify-center"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      titulo="Unirte a una tienda"
      subtitulo={`Con la cuenta ${user.email ?? ""}`}
    >
      <form onSubmit={onCanjear} className="space-y-3">
        <input
          type="text"
          required
          maxLength={8}
          placeholder="Código de invitación"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          className={`${claseInput} uppercase tracking-widest text-center font-mono`}
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
      </form>
      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-fg-secondary">
          Volver a la app
        </Link>
      </div>
    </AuthCard>
  );
}

export default function UnirsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-canvas flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <UnirseContent />
    </Suspense>
  );
}
