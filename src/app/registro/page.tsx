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

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Adónde seguir post-registro: /unirse?codigo=X cuando viene de una
  // invitación; sin next, AuthProvider manda la cuenta nueva a /onboarding.
  const next = destinoSeguro(searchParams.get("next"));
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pendienteConfirmacion, setPendienteConfirmacion] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // El trigger de DB (0017) crea el perfil con este nombre; es lo que
      // ven los compañeros en "agregado por" / "guardada por".
      options: { data: { nombre: nombre.trim() } },
    });
    setEnviando(false);
    if (signUpError) {
      setError(
        /signup.*(disabled|not allowed)/i.test(signUpError.message)
          ? "El registro está deshabilitado por ahora. Pedile acceso al encargado."
          : signUpError.message
      );
      return;
    }
    if (data.session) {
      router.replace(next);
      return;
    }
    setPendienteConfirmacion(true);
  }

  if (pendienteConfirmacion) {
    return (
      <AuthCard titulo="Revisá tu email">
        <p className="text-sm text-fg-secondary text-center">
          Te enviamos un enlace para confirmar la cuenta. Después vas a poder
          iniciar sesión.
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
    <AuthCard titulo="Crear cuenta" subtitulo="Para el equipo de tu tienda">
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="text"
          autoComplete="name"
          required
          maxLength={60}
          placeholder="Tu nombre (lo ve tu equipo)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={claseInput}
        />
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
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={claseInput}
        />
        <MensajeError mensaje={error} />
        <button type="submit" disabled={enviando} className={claseBotonPrimario}>
          {enviando ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            "Registrarme"
          )}
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        <Link
          href={
            next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`
          }
          className="text-fg-secondary"
        >
          ¿Ya tenés cuenta? <span className="text-accent">Iniciá sesión</span>
        </Link>
      </div>
    </AuthCard>
  );
}

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-canvas flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <RegistroContent />
    </Suspense>
  );
}
