"use client";

import {
  AuthCard,
  claseBotonPrimario,
  claseInput,
  MensajeError,
} from "@/components/auth/AuthCard";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/restablecer` }
    );
    setEnviando(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <AuthCard titulo="Revisá tu email">
        <p className="text-sm text-fg-secondary text-center">
          Si existe una cuenta con ese email, te va a llegar un enlace para
          restablecer la contraseña.
        </p>
        <Link
          href="/login"
          className="block text-center text-accent text-sm mt-4"
        >
          Volver a iniciar sesión
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      titulo="Recuperar contraseña"
      subtitulo="Te enviamos un enlace por email"
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          autoComplete="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={claseInput}
        />
        <MensajeError mensaje={error} />
        <button type="submit" disabled={enviando} className={claseBotonPrimario}>
          {enviando ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            "Enviar enlace"
          )}
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        <Link href="/login" className="text-accent">
          Volver a iniciar sesión
        </Link>
      </div>
    </AuthCard>
  );
}
