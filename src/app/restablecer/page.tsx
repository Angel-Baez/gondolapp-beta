"use client";

import {
  AuthCard,
  claseBotonPrimario,
  claseInput,
  MensajeError,
} from "@/components/auth/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

/**
 * Destino del enlace de recuperación: el cliente browser intercambia el
 * código de la URL por una sesión al cargar (PKCE + detectSessionInUrl),
 * y acá solo se setea la contraseña nueva sobre esa sesión.
 */
export default function RestablecerPage() {
  const router = useRouter();
  const { user, cargando } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setError(null);
    setEnviando(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setEnviando(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/");
  }

  if (cargando) {
    return (
      <AuthCard titulo="Restablecer contraseña">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
      </AuthCard>
    );
  }

  if (!user) {
    return (
      <AuthCard titulo="Enlace inválido">
        <p className="text-sm text-fg-secondary text-center">
          El enlace expiró o no es válido. Pedí uno nuevo.
        </p>
        <Link
          href="/recuperar"
          className="block text-center text-accent text-sm mt-4"
        >
          Recuperar contraseña
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard titulo="Nueva contraseña">
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Contraseña nueva (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={claseInput}
        />
        <input
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repetir contraseña"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          className={claseInput}
        />
        <MensajeError mensaje={error} />
        <button type="submit" disabled={enviando} className={claseBotonPrimario}>
          {enviando ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            "Guardar contraseña"
          )}
        </button>
      </form>
    </AuthCard>
  );
}
