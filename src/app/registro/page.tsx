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
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegistroPage() {
  const router = useRouter();
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
    });
    setEnviando(false);
    if (signUpError) {
      // Durante las Fases 1–2 los signups públicos están deshabilitados en
      // Supabase Auth; se habilitan con el onboarding de la Fase 3.
      setError(
        /signup.*(disabled|not allowed)/i.test(signUpError.message)
          ? "El registro está deshabilitado por ahora. Pedile acceso al encargado."
          : signUpError.message
      );
      return;
    }
    if (data.session) {
      router.replace("/");
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
        <Link href="/login" className="text-fg-secondary">
          ¿Ya tenés cuenta? <span className="text-accent">Iniciá sesión</span>
        </Link>
      </div>
    </AuthCard>
  );
}
