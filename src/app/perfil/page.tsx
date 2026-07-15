"use client";

import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useCerrarSesion } from "@/hooks/useCerrarSesion";
import {
  useActualizarMiNombre,
  useMiPerfil,
  useNombreTienda,
  useQuitarMiembro,
} from "@/hooks/useEquipo";
import {
  Check,
  ChevronRight,
  Loader2,
  LogOut,
  Pencil,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

/** Nombre propio, editable: es lo que ven los compañeros en la atribución
 * de items y listas. */
function SeccionNombrePropio() {
  const { data: nombre, isPending } = useMiPerfil();
  const actualizar = useActualizarMiNombre();
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");

  const guardar = async () => {
    const limpio = borrador.trim();
    if (!limpio || limpio === nombre) {
      setEditando(false);
      return;
    }
    try {
      await actualizar.mutateAsync(limpio);
      toast.success("Nombre actualizado");
      setEditando(false);
    } catch {
      toast.error("No se pudo actualizar el nombre");
    }
  };

  return (
    <div className="island p-4 mb-4">
      <div className="text-footnote font-semibold text-fg-secondary uppercase tracking-wide mb-2">
        Tu nombre
      </div>
      {editando ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            maxLength={60}
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            className="flex-1 h-11 px-3 rounded-field bg-surface-2 text-fg outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          <button
            onClick={guardar}
            disabled={actualizar.isPending}
            aria-label="Guardar nombre"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-accent text-on-accent disabled:opacity-50"
          >
            {actualizar.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
          </button>
          <button
            onClick={() => setEditando(false)}
            aria-label="Cancelar"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-2 text-fg-secondary"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-title-3 text-fg font-semibold truncate">
            {isPending ? "…" : nombre}
          </span>
          <button
            onClick={() => {
              setBorrador(nombre ?? "");
              setEditando(true);
            }}
            aria-label="Editar nombre"
            className="w-11 h-11 flex items-center justify-center rounded-full text-fg-secondary hover:bg-surface-2 transition-colors shrink-0"
          >
            <Pencil size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function SeccionTienda() {
  const { rol } = useAuth();
  const { data: nombreTienda } = useNombreTienda();
  const esAdmin = rol === "admin";

  return (
    <div className="island p-4 mb-4">
      <div className="text-footnote font-semibold text-fg-secondary uppercase tracking-wide mb-2">
        Tu tienda
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-body text-fg font-semibold truncate">
            {nombreTienda ?? "…"}
          </div>
          <div className="mt-1">
            {esAdmin ? (
              <span className="inline-flex items-center gap-1 bg-accent-soft text-accent px-2.5 py-1 rounded-chip text-caption font-semibold">
                <ShieldCheck size={12} /> Admin
              </span>
            ) : (
              <span className="bg-surface-2 text-fg-secondary px-2.5 py-1 rounded-chip text-caption font-semibold">
                Empleado
              </span>
            )}
          </div>
        </div>
        {esAdmin && (
          <Link
            href="/tienda"
            className="shrink-0 h-11 px-4 rounded-full bg-surface-2 text-fg font-semibold text-subhead flex items-center gap-1.5 hover:bg-border transition-colors"
          >
            <Store size={16} /> Gestionar <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}

function SeccionSalirDeTienda() {
  const router = useRouter();
  const { user, refrescarMembresia } = useAuth();
  const quitar = useQuitarMiembro();
  const [confirmando, setConfirmando] = useState(false);

  const onSalir = async () => {
    if (!user) return;
    try {
      await quitar.mutateAsync(user.id);
      await refrescarMembresia();
      router.replace("/onboarding");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message.includes("sin admin")
          ? "La tienda no puede quedarse sin admin: nombrá otro admin primero"
          : "No se pudo salir de la tienda"
      );
      setConfirmando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirmando(true)}
        className="w-full h-12 bg-alert-critico/10 hover:bg-alert-critico/20 text-alert-critico font-semibold rounded-field transition-colors flex items-center justify-center gap-2 mb-3"
      >
        <LogOut size={18} />
        <span>Salir de la tienda</span>
      </button>

      <BottomSheet
        isOpen={confirmando}
        onClose={() => setConfirmando(false)}
        title="Salir de la tienda"
      >
        <div className="space-y-4">
          <p className="text-body text-fg-secondary">
            Vas a perder el acceso a las listas y el catálogo de esta tienda.
            Para volver, alguien del equipo tiene que invitarte de nuevo.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmando(false)}
              disabled={quitar.isPending}
              className="flex-1 bg-surface-2 hover:bg-border text-fg-secondary font-semibold h-12 px-4 rounded-field transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSalir}
              disabled={quitar.isPending}
              className="flex-1 bg-alert-critico text-white font-semibold h-12 px-4 rounded-field transition-colors disabled:opacity-50"
            >
              {quitar.isPending ? "Saliendo..." : "Salir"}
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

export default function PerfilPage() {
  const { user } = useAuth();
  const { cerrarSesion, cerrando } = useCerrarSesion();

  return (
    <AppShell
      renderHeader={() => (
        <PageHeader title="Tu perfil" subtitle={user?.email ?? undefined} />
      )}
    >
      <div className="pb-8">
        <SeccionNombrePropio />
        <SeccionTienda />
        <SeccionSalirDeTienda />
        <button
          onClick={cerrarSesion}
          disabled={cerrando}
          className="w-full h-12 bg-surface-2 hover:bg-border text-fg-secondary font-semibold rounded-field transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {cerrando ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <LogOut size={18} />
          )}
          <span>Cerrar sesión</span>
        </button>
      </div>
    </AppShell>
  );
}
