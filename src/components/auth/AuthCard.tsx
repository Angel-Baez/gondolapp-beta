"use client";

/**
 * Marco compartido de las pantallas de auth: canvas centrado a ancho de
 * teléfono, título de la app y un card con el formulario.
 */
export function AuthCard({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-accent">GondolApp</h1>
          <h2 className="mt-4 text-xl font-semibold text-fg">{titulo}</h2>
          {subtitulo && (
            <p className="mt-1 text-sm text-fg-secondary">{subtitulo}</p>
          )}
        </div>
        <div className="bg-surface rounded-3xl p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}

export const claseInput =
  "w-full h-12 px-4 rounded-2xl bg-surface-2 text-fg placeholder:text-fg-tertiary outline-none focus:ring-2 focus:ring-accent";

export const claseBotonPrimario =
  "w-full h-12 rounded-full bg-accent text-on-accent font-semibold disabled:opacity-50 transition-opacity";

export function MensajeError({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="text-sm text-red-500 mt-3">
      {mensaje}
    </p>
  );
}
