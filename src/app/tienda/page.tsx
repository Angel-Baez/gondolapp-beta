"use client";

import { useAuth } from "@/components/AuthProvider";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/shell/PageHeader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  useCambiarRol,
  useGenerarInvitacion,
  useInvitaciones,
  useMiembros,
  useNombreTienda,
  useQuitarMiembro,
  useRenombrarTienda,
  useRevocarInvitacion,
} from "@/hooks/useEquipo";
import type { MiembroTienda } from "@/services/equipo";
import type { RolTienda } from "@/store/sesion";
import {
  Check,
  Copy,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Ticket,
  UserMinus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const MENSAJE_ULTIMO_ADMIN = "La tienda no puede quedarse sin admin";

function mensajeDeError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.includes(MENSAJE_ULTIMO_ADMIN)) {
    return `${MENSAJE_ULTIMO_ADMIN}: nombrá otro admin primero`;
  }
  return fallback;
}

/** Nombre de la tienda, editable inline por el admin. */
function SeccionNombre({ esAdmin }: { esAdmin: boolean }) {
  const { data: nombre, isPending } = useNombreTienda();
  const renombrar = useRenombrarTienda();
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState("");

  const guardar = async () => {
    const limpio = borrador.trim();
    if (!limpio || limpio === nombre) {
      setEditando(false);
      return;
    }
    try {
      await renombrar.mutateAsync(limpio);
      toast.success("Tienda renombrada");
      setEditando(false);
    } catch {
      toast.error("No se pudo renombrar la tienda");
    }
  };

  return (
    <div className="island p-4 mb-4">
      <div className="text-footnote font-semibold text-fg-secondary uppercase tracking-wide mb-2">
        Tienda
      </div>
      {editando ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            maxLength={80}
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            className="flex-1 h-11 px-3 rounded-field bg-surface-2 text-fg outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          <button
            onClick={guardar}
            disabled={renombrar.isPending}
            aria-label="Guardar nombre"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-accent text-on-accent disabled:opacity-50"
          >
            {renombrar.isPending ? (
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
          {esAdmin && (
            <button
              onClick={() => {
                setBorrador(nombre ?? "");
                setEditando(true);
              }}
              aria-label="Renombrar tienda"
              className="w-11 h-11 flex items-center justify-center rounded-full text-fg-secondary hover:bg-surface-2 transition-colors shrink-0"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ChipRol({ rol }: { rol: RolTienda }) {
  return rol === "admin" ? (
    <span className="inline-flex items-center gap-1 bg-accent-soft text-accent px-2.5 py-1 rounded-chip text-caption font-semibold">
      <ShieldCheck size={12} /> Admin
    </span>
  ) : (
    <span className="bg-surface-2 text-fg-secondary px-2.5 py-1 rounded-chip text-caption font-semibold">
      Empleado
    </span>
  );
}

/** Lista de miembros; el admin puede cambiar roles y expulsar. */
function SeccionEquipo({ esAdmin }: { esAdmin: boolean }) {
  const { user } = useAuth();
  const { data: miembros, isPending, isError } = useMiembros();
  const cambiarRol = useCambiarRol();
  const quitar = useQuitarMiembro();
  const [aExpulsar, setAExpulsar] = useState<MiembroTienda | null>(null);

  const onCambiarRol = async (m: MiembroTienda) => {
    const nuevo: RolTienda = m.rol === "admin" ? "empleado" : "admin";
    try {
      await cambiarRol.mutateAsync({ userId: m.userId, rol: nuevo });
      toast.success(
        nuevo === "admin" ? `${m.email} ahora es admin` : `${m.email} ahora es empleado`
      );
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudo cambiar el rol"));
    }
  };

  const onExpulsar = async () => {
    if (!aExpulsar) return;
    try {
      await quitar.mutateAsync(aExpulsar.userId);
      toast.success(`${aExpulsar.email} fue quitado de la tienda`);
      setAExpulsar(null);
    } catch (err) {
      toast.error(mensajeDeError(err, "No se pudo quitar al miembro"));
    }
  };

  return (
    <div className="island p-4 mb-4">
      <div className="text-footnote font-semibold text-fg-secondary uppercase tracking-wide mb-3">
        Equipo
      </div>
      {isPending && (
        <div className="py-4 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-fg-tertiary" />
        </div>
      )}
      {isError && (
        <p className="text-subhead text-fg-secondary py-2">
          No se pudo cargar el equipo. Revisá tu conexión.
        </p>
      )}
      <div className="space-y-3">
        {miembros?.map((m) => {
          const esYo = m.userId === user?.id;
          return (
            <div key={m.userId} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-body text-fg truncate">
                  {m.nombre}
                  {esYo && (
                    <span className="text-fg-tertiary text-footnote ml-1.5">
                      (vos)
                    </span>
                  )}
                </div>
                <div className="text-footnote text-fg-tertiary truncate">
                  {m.email}
                </div>
                <div className="mt-1">
                  <ChipRol rol={m.rol} />
                </div>
              </div>
              {esAdmin && !esYo && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onCambiarRol(m)}
                    disabled={cambiarRol.isPending}
                    className="h-9 px-3 rounded-full bg-surface-2 text-fg-secondary text-caption font-semibold hover:bg-border transition-colors disabled:opacity-50"
                  >
                    {m.rol === "admin" ? "Hacer empleado" : "Hacer admin"}
                  </button>
                  <button
                    onClick={() => setAExpulsar(m)}
                    aria-label={`Quitar a ${m.email}`}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-alert-critico hover:bg-alert-critico/10 transition-colors"
                  >
                    <UserMinus size={18} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomSheet
        isOpen={!!aExpulsar}
        onClose={() => setAExpulsar(null)}
        title="Quitar de la tienda"
      >
        <div className="space-y-4">
          <p className="text-body text-fg-secondary">
            {aExpulsar?.email} va a perder el acceso a los datos de la tienda
            en cuanto vuelva a conectarse. ¿Continuar?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setAExpulsar(null)}
              disabled={quitar.isPending}
              className="flex-1 bg-surface-2 hover:bg-border text-fg-secondary font-semibold h-12 px-4 rounded-field transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onExpulsar}
              disabled={quitar.isPending}
              className="flex-1 bg-alert-critico text-white font-semibold h-12 px-4 rounded-field transition-colors disabled:opacity-50"
            >
              {quitar.isPending ? "Quitando..." : "Quitar"}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/** Invitaciones (solo admin): generar códigos y revocar los vigentes. */
function SeccionInvitaciones() {
  const { data: invitaciones } = useInvitaciones();
  const generar = useGenerarInvitacion();
  const revocar = useRevocarInvitacionConToast();
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [rolNuevo, setRolNuevo] = useState<RolTienda>("empleado");
  const [usosNuevos, setUsosNuevos] = useState(1);
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);

  const vigentes = (invitaciones ?? []).filter(
    (i) => !i.revocada && i.expiraAt > new Date() && i.usos < i.maxUsos
  );

  const onGenerar = async () => {
    try {
      const codigo = await generar.mutateAsync({
        rol: rolNuevo,
        maxUsos: usosNuevos,
        dias: 7,
      });
      setCodigoGenerado(codigo);
    } catch {
      toast.error("No se pudo generar el código");
    }
  };

  const copiarLink = (codigo: string) => {
    navigator.clipboard
      .writeText(`${window.location.origin}/unirse?codigo=${codigo}`)
      .then(() => toast.success("Link copiado"))
      .catch(() => toast.error("No se pudo copiar"));
  };

  const cerrarSheet = () => {
    setSheetAbierto(false);
    setCodigoGenerado(null);
  };

  return (
    <div className="island p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-footnote font-semibold text-fg-secondary uppercase tracking-wide">
          Invitaciones
        </div>
        <button
          onClick={() => setSheetAbierto(true)}
          className="h-9 px-3 rounded-full bg-accent text-on-accent text-caption font-semibold flex items-center gap-1.5"
        >
          <Plus size={14} /> Generar código
        </button>
      </div>

      {vigentes.length === 0 ? (
        <p className="text-subhead text-fg-secondary flex items-center gap-2">
          <Ticket size={16} className="text-fg-tertiary" />
          No hay códigos vigentes
        </p>
      ) : (
        <div className="space-y-3">
          {vigentes.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-body tracking-widest text-fg">
                  {inv.codigo}
                </div>
                <div className="text-footnote text-fg-tertiary mt-0.5">
                  {inv.rol === "admin" ? "Admin" : "Empleado"} · {inv.usos}/
                  {inv.maxUsos} usos · vence{" "}
                  {new Intl.DateTimeFormat("es-ES", {
                    day: "numeric",
                    month: "short",
                  }).format(inv.expiraAt)}
                </div>
              </div>
              <button
                onClick={() => copiarLink(inv.codigo)}
                aria-label="Copiar link de invitación"
                className="w-9 h-9 flex items-center justify-center rounded-full text-fg-secondary hover:bg-surface-2 transition-colors"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => revocar(inv.id)}
                aria-label="Revocar invitación"
                className="w-9 h-9 flex items-center justify-center rounded-full text-alert-critico hover:bg-alert-critico/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomSheet
        isOpen={sheetAbierto}
        onClose={cerrarSheet}
        title={codigoGenerado ? "Código listo" : "Generar invitación"}
      >
        {codigoGenerado ? (
          <div className="space-y-4 text-center">
            <p className="text-body text-fg-secondary">
              Dictalo en voz alta o compartí el link. Vence en 7 días.
            </p>
            <div className="font-mono text-3xl tracking-[0.3em] text-fg py-2">
              {codigoGenerado}
            </div>
            <button
              onClick={() => copiarLink(codigoGenerado)}
              className="w-full h-12 rounded-full bg-accent text-on-accent font-semibold flex items-center justify-center gap-2"
            >
              <Copy size={18} /> Copiar link
            </button>
            <button
              onClick={cerrarSheet}
              className="w-full h-12 rounded-full bg-surface-2 text-fg-secondary font-semibold"
            >
              Listo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-footnote font-semibold text-fg-secondary uppercase tracking-wide mb-2">
                Rol del invitado
              </div>
              <div className="flex gap-2">
                {(["empleado", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRolNuevo(r)}
                    className={`flex-1 h-11 rounded-field font-semibold text-subhead transition-colors ${
                      rolNuevo === r
                        ? "bg-accent text-on-accent"
                        : "bg-surface-2 text-fg-secondary"
                    }`}
                  >
                    {r === "empleado" ? "Empleado" : "Admin"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-footnote font-semibold text-fg-secondary uppercase tracking-wide mb-2">
                Cantidad de usos
              </div>
              <div className="flex gap-2">
                {[1, 5, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setUsosNuevos(n)}
                    className={`flex-1 h-11 rounded-field font-semibold text-subhead transition-colors ${
                      usosNuevos === n
                        ? "bg-accent text-on-accent"
                        : "bg-surface-2 text-fg-secondary"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={onGenerar}
              disabled={generar.isPending}
              className="w-full h-12 rounded-full bg-accent text-on-accent font-semibold disabled:opacity-50"
            >
              {generar.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Generar código"
              )}
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

/** Wrapper chico para no repetir el manejo de errores del revoke. */
function useRevocarInvitacionConToast() {
  const revocar = useRevocarInvitacion();
  return async (id: string) => {
    try {
      await revocar.mutateAsync(id);
      toast.success("Invitación revocada");
    } catch {
      toast.error("No se pudo revocar la invitación");
    }
  };
}

export default function TiendaPage() {
  const router = useRouter();
  const { cargando, rol } = useAuth();
  const esAdmin = rol === "admin";

  // Pantalla exclusiva de admins: un empleado ni la ve (además del
  // hardening server-side de la 0017, que le devuelve vacío igual).
  useEffect(() => {
    if (!cargando && rol === "empleado") router.replace("/");
  }, [cargando, rol, router]);

  if (!esAdmin) {
    return (
      <div className="h-dvh bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <AppShell
      renderHeader={() => (
        <PageHeader title="Mi tienda" subtitle="Equipo e invitaciones" backHref="/perfil" />
      )}
    >
      <div className="pb-8">
        <SeccionNombre esAdmin={esAdmin} />
        <SeccionEquipo esAdmin={esAdmin} />
        <SeccionInvitaciones />
      </div>
    </AppShell>
  );
}
