import { FeedbackMetadata } from "@/types";

/**
 * Detecta el sistema operativo del usuario
 */
function detectarSistemaOperativo(): string {
  if (typeof window === "undefined") return "Desconocido";
  
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  
  return "Desconocido";
}

/**
 * Detecta el navegador del usuario
 */
function detectarNavegador(): string {
  if (typeof window === "undefined") return "Desconocido";
  
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";
  
  return "Desconocido";
}

/**
 * Detecta el tipo de dispositivo
 */
function detectarDispositivo(): string {
  if (typeof window === "undefined") return "Desconocido";
  
  const userAgent = navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) return "Móvil";
  
  return "Escritorio";
}

/**
 * Obtiene la resolución de pantalla
 */
function obtenerResolucion(): string {
  if (typeof window === "undefined") return "Desconocida";
  
  return `${window.screen.width}x${window.screen.height}`;
}

/**
 * Captura automáticamente los metadatos del dispositivo/navegador
 */
export function capturarMetadata(): FeedbackMetadata {
  if (typeof window === "undefined") {
    return {
      navegador: "Server",
      dispositivo: "Server",
      versionApp: "1.0.0",
      url: "",
      userAgent: "",
      sistemaOperativo: "Server",
      resolucionPantalla: "N/A",
    };
  }

  return {
    navegador: detectarNavegador(),
    dispositivo: detectarDispositivo(),
    versionApp: "1.0.0", // Versión de la app
    url: window.location.href,
    userAgent: navigator.userAgent,
    sistemaOperativo: detectarSistemaOperativo(),
    resolucionPantalla: obtenerResolucion(),
  };
}

/**
 * Sanitiza texto para prevenir XSS
 */
export function sanitizarTexto(texto: string): string {
  if (!texto) return "";
  
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .trim();
}

/**
 * Valida el formato de email
 */
export function validarEmail(email: string): boolean {
  if (!email) return true; // Email es opcional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Genera un ID único para el usuario anónimo
 */
export function generarUserIdAnonimo(): string {
  if (typeof window === "undefined") return "";
  
  const storedId = localStorage.getItem("gondolapp_user_id");
  if (storedId) return storedId;
  
  const nuevoId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem("gondolapp_user_id", nuevoId);
  return nuevoId;
}
