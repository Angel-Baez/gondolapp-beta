"use client";

import {
  AuthCard,
  claseBotonPrimario,
  claseInput,
  MensajeError,
} from "@/components/auth/AuthCard";
import { destinoSeguro } from "@/lib/navegacion";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Adónde volver post-login (p. ej. /unirse?codigo=X), saneado.
  const next = destinoSeguro(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setEnviando(false);
    if (loginError) {
      setError(
        loginError.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos"
          : loginError.message
      );
      return;
    }
    router.replace(next);
  }

  return (
    <AuthCard titulo="Iniciar sesión" subtitulo="Entrá para ver tus listas">
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
        <input
          type="password"
          autoComplete="current-password"
          required
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={claseInput}
        />
        <MensajeError mensaje={error} />
        <button type="submit" disabled={enviando} className={claseBotonPrimario}>
          {enviando ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            "Entrar"
          )}
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-2 text-center text-sm">
        <Link href="/recuperar" className="text-accent">
          Olvidé mi contraseña
        </Link>
        <Link
          href={
            next === "/"
              ? "/registro"
              : `/registro?next=${encodeURIComponent(next)}`
          }
          className="text-fg-secondary"
        >
          ¿No tenés cuenta? <span className="text-accent">Registrate</span>
        </Link>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-canvas flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
