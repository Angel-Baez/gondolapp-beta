"use client";

import { solicitarPermiso, soportaNotificaciones } from "@/lib/notificacionesVencimiento";
import { useNotificacionesStore } from "@/store/notificaciones";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

/**
 * Toggle de notificaciones de vencimientos urgentes. Pide el permiso del
 * navegador la primera vez; después alterna la preferencia local sin tocar
 * los permisos del sitio.
 */
export function NotificacionesBell() {
  const { habilitadas, setHabilitadas } = useNotificacionesStore();
  // Detectar soporte en un efecto (no en render) para no romper la
  // hidratación: el server no tiene window.Notification.
  const [soportadas, setSoportadas] = useState(false);
  useEffect(() => {
    setSoportadas(soportaNotificaciones());
  }, []);

  if (!soportadas) return null;

  const handleClick = async () => {
    if (habilitadas) {
      setHabilitadas(false);
      toast("Notificaciones desactivadas", { icon: "🔕" });
      return;
    }
    const permiso = await solicitarPermiso();
    if (permiso === "granted") {
      setHabilitadas(true);
      toast.success("Te avisamos cuando un producto esté por vencer");
    } else {
      toast.error(
        "Permiso bloqueado: activá las notificaciones de GondolApp en los ajustes del navegador"
      );
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={
        habilitadas
          ? "Desactivar notificaciones de vencimientos"
          : "Activar notificaciones de vencimientos"
      }
      aria-pressed={habilitadas}
      className={`w-11 h-11 flex items-center justify-center rounded-full transition-colors hover:bg-surface-2 ${
        habilitadas ? "text-accent" : "text-fg-secondary"
      }`}
    >
      {habilitadas ? <Bell size={22} /> : <BellOff size={22} />}
    </button>
  );
}
