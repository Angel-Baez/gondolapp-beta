"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { 
  X, 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  MoreHorizontal,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import { useFeedbackStore } from "@/store/feedback";
import { capturarMetadata, validarEmail } from "@/lib/feedbackUtils";
import { 
  FeedbackTipo, 
  FeedbackPrioridad, 
  FeedbackCategoria, 
  CrearFeedbackDTO 
} from "@/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import toast from "react-hot-toast";

// Configuración de tipos de feedback
const TIPOS_FEEDBACK: { id: FeedbackTipo; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "Bug", label: "Bug/Defecto", icon: <Bug size={16} />, color: "bg-red-100 text-red-700 border-red-300" },
  { id: "Mejora", label: "Sugerencia", icon: <Lightbulb size={16} />, color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { id: "Pregunta", label: "Duda/Consulta", icon: <HelpCircle size={16} />, color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "Otro", label: "Otro", icon: <MoreHorizontal size={16} />, color: "bg-gray-100 text-gray-700 border-gray-300" },
];

// Configuración de categorías
const CATEGORIAS: { id: FeedbackCategoria; label: string }[] = [
  { id: "escaneo", label: "Escaneo" },
  { id: "inventario", label: "Inventario" },
  { id: "vencimientos", label: "Vencimientos" },
  { id: "ui/ux", label: "UI/UX" },
  { id: "rendimiento", label: "Rendimiento" },
  { id: "seguridad", label: "Seguridad" },
  { id: "notificaciones", label: "Notificaciones" },
  { id: "integraciones", label: "Integraciones" },
  { id: "reportes", label: "Reportes" },
  { id: "configuracion", label: "Configuración" },
  { id: "otro", label: "Otro" },
];

// Configuración de prioridades
const PRIORIDADES: { id: FeedbackPrioridad; label: string; color: string }[] = [
  { id: "Baja", label: "Baja", color: "bg-gray-100 text-gray-700" },
  { id: "Media", label: "Media", color: "bg-blue-100 text-blue-700" },
  { id: "Alta", label: "Alta", color: "bg-orange-100 text-orange-700" },
];

/**
 * FeedbackForm - Formulario modal para enviar feedback
 * 
 * En móvil: Se muestra como Bottom Sheet (desde abajo, con gesto de arrastre)
 * En desktop: Se muestra como modal centrado tradicional
 */
export function FeedbackForm() {
  const { 
    isModalOpen, 
    isSubmitting, 
    submitSuccess,
    closeModal, 
    setSubmitting, 
    setSubmitSuccess,
    resetState 
  } = useFeedbackStore();

  const isMobile = useIsMobile();

  // Estado del formulario
  const [tipos, setTipos] = useState<FeedbackTipo[]>([]);
  const [categorias, setCategorias] = useState<FeedbackCategoria[]>([]);
  const [prioridad, setPrioridad] = useState<FeedbackPrioridad>("Media");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [email, setEmail] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  
  // Estado de validación
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Resetear formulario cuando se cierra
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (!isModalOpen) {
      // Resetear después de un delay para la animación
      timer = setTimeout(() => {
        setTipos([]);
        setCategorias([]);
        setPrioridad("Media");
        setTitulo("");
        setDescripcion("");
        setEmail("");
        setScreenshots([]);
        setErrores({});
        resetState();
      }, 300);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isModalOpen]); // Removed resetState from dependencies as it's stable from Zustand

  // Manejar el gesto de arrastre (solo para móvil)
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Cerrar si se arrastra más de 100px hacia abajo o con velocidad alta
      if (info.offset.y > 100 || info.velocity.y > 500) {
        closeModal();
      }
    },
    [closeModal]
  );

  // Toggle tipo de feedback
  const toggleTipo = (tipo: FeedbackTipo) => {
    setTipos(prev => 
      prev.includes(tipo) 
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    );
    if (errores.tipo) {
      setErrores(prev => ({ ...prev, tipo: "" }));
    }
  };

  // Toggle categoría
  const toggleCategoria = (cat: FeedbackCategoria) => {
    setCategorias(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
    if (errores.categorias) {
      setErrores(prev => ({ ...prev, categorias: "" }));
    }
  };

  // Manejar imagen (placeholder - en producción usaría Cloudinary/S3)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede exceder 5MB");
      return;
    }

    // Convertir a base64 para preview (en producción se subiría a un servicio)
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setScreenshots(prev => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Eliminar screenshot
  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  // Validar formulario
  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (tipos.length === 0) {
      nuevosErrores.tipo = "Selecciona al menos un tipo de feedback";
    }

    if (categorias.length === 0) {
      nuevosErrores.categorias = "Selecciona al menos una categoría";
    }

    if (!titulo.trim()) {
      nuevosErrores.titulo = "El título es obligatorio";
    } else if (titulo.length > 100) {
      nuevosErrores.titulo = "El título no puede exceder 100 caracteres";
    }

    if (!descripcion.trim()) {
      nuevosErrores.descripcion = "La descripción es obligatoria";
    }

    if (email && !validarEmail(email)) {
      nuevosErrores.email = "El formato del email no es válido";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error("Por favor, corrige los errores del formulario");
      return;
    }

    setSubmitting(true);

    try {
      const metadata = capturarMetadata();
      
      const feedbackData: CrearFeedbackDTO = {
        tipo: tipos,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        prioridad,
        categorias,
        screenshots,
        userEmail: email.trim() || undefined,
        metadata,
      };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al enviar feedback");
      }

      setSubmitSuccess(true);
      toast.success("¡Gracias por tu feedback!");
      
      // Cerrar modal después de mostrar éxito
      setTimeout(() => {
        closeModal();
      }, 2000);

    } catch (error) {
      console.error("Error al enviar feedback:", error);
      toast.error(error instanceof Error ? error.message : "Error al enviar feedback");
    } finally {
      setSubmitting(false);
    }
  };

  // Contenido compartido: Estado de éxito
  const renderSuccessState = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 flex flex-col items-center justify-center text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
      >
        <CheckCircle size={80} className="text-green-500 mb-4" />
      </motion.div>
      <h4 className="text-2xl font-bold text-gray-900 mb-2">
        ¡Feedback Enviado!
      </h4>
      <p className="text-gray-600">
        Gracias por ayudarnos a mejorar GondolApp.
      </p>
    </motion.div>
  );

  // Contenido compartido: Formulario
  const renderFormContent = () => (
    <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">
      {/* Tipo de Feedback - Chips */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tipo de Reporte *
        </label>
        <div className="flex flex-wrap gap-2">
          {TIPOS_FEEDBACK.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              onClick={() => toggleTipo(tipo.id)}
              aria-pressed={tipos.includes(tipo.id)}
              aria-label={`${tipo.label} ${tipos.includes(tipo.id) ? "seleccionado" : ""}`}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all
                ${tipos.includes(tipo.id) 
                  ? tipo.color + " border-current" 
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}
              `}
            >
              {tipo.icon}
              {tipo.label}
            </button>
          ))}
        </div>
        {errores.tipo && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle size={12} />
            {errores.tipo}
          </p>
        )}
      </div>

      {/* Categorías - Chips */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Área/Módulo Afectado *
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategoria(cat.id)}
              aria-pressed={categorias.includes(cat.id)}
              aria-label={`${cat.label} ${categorias.includes(cat.id) ? "seleccionado" : ""}`}
              className={`
                px-3 py-1 rounded-full border text-sm font-medium transition-all
                ${categorias.includes(cat.id)
                  ? "bg-accent-primary text-white border-accent-primary"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"}
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {errores.categorias && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle size={12} />
            {errores.categorias}
          </p>
        )}
      </div>

      {/* Prioridad */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Prioridad
        </label>
        <div className="flex gap-2">
          {PRIORIDADES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPrioridad(p.id)}
              className={`
                px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${prioridad === p.id
                  ? p.color + " ring-2 ring-offset-1 ring-current"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"}
              `}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Título */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Título *
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            if (errores.titulo) setErrores(prev => ({ ...prev, titulo: "" }));
          }}
          placeholder="Resumen breve del problema/sugerencia"
          maxLength={100}
          className={`
            w-full px-4 py-2.5 border-2 rounded-xl transition-all
            ${errores.titulo ? "border-red-400" : "border-gray-300 focus:border-accent-primary"}
            focus:outline-none focus:ring-2 focus:ring-accent-primary/20
          `}
        />
        <div className="flex justify-between mt-1">
          {errores.titulo ? (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle size={12} />
              {errores.titulo}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">{titulo.length}/100</span>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Descripción *
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => {
            setDescripcion(e.target.value);
            if (errores.descripcion) setErrores(prev => ({ ...prev, descripcion: "" }));
          }}
          placeholder="Describe el problema o sugerencia con detalle. Incluye pasos para reproducir el error si aplica."
          rows={4}
          className={`
            w-full px-4 py-2.5 border-2 rounded-xl transition-all resize-none
            ${errores.descripcion ? "border-red-400" : "border-gray-300 focus:border-accent-primary"}
            focus:outline-none focus:ring-2 focus:ring-accent-primary/20
          `}
        />
        {errores.descripcion && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle size={12} />
            {errores.descripcion}
          </p>
        )}
      </div>

      {/* Screenshots */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Capturas de Pantalla (opcional)
        </label>
        
        {/* Preview de screenshots */}
        {screenshots.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {screenshots.map((src, index) => (
              <div key={index} className="relative group">
                <img 
                  src={src} 
                  alt={`Screenshot ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeScreenshot(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-accent-primary hover:bg-accent-primary/5 transition-all">
          <ImageIcon size={20} className="text-gray-500" />
          <span className="text-sm text-gray-600">Añadir imagen</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Email (opcional)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errores.email) setErrores(prev => ({ ...prev, email: "" }));
          }}
          placeholder="Para recibir actualizaciones sobre tu reporte"
          className={`
            w-full px-4 py-2.5 border-2 rounded-xl transition-all
            ${errores.email ? "border-red-400" : "border-gray-300 focus:border-accent-primary"}
            focus:outline-none focus:ring-2 focus:ring-accent-primary/20
          `}
        />
        {errores.email && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle size={12} />
            {errores.email}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all
          ${isSubmitting 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-accent-primary hover:bg-accent-primary/90 active:scale-[0.98]"}
        `}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send size={20} />
            Enviar Feedback
          </>
        )}
      </button>
    </form>
  );

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {isMobile ? (
            /* Bottom Sheet para móvil */
            <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ 
                  type: "spring", 
                  damping: 30, 
                  stiffness: 300 
                }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={handleDragEnd}
                className="bg-white rounded-t-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              >
                {/* Handle Indicator - Área de arrastre */}
                <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-4 pb-3 pt-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-accent-primary to-cyan-600 -mt-2">
                  <h3 className="text-xl font-bold text-white">
                    📝 Reportar Feedback
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded-full hover:bg-white/20 text-white transition"
                    aria-label="Cerrar"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Content */}
                {submitSuccess ? renderSuccessState() : renderFormContent()}
              </motion.div>
            </div>
          ) : (
            /* Modal centrado para desktop */
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-accent-primary to-cyan-600">
                  <h3 className="text-xl font-bold text-white">
                    📝 Reportar Feedback
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded-full hover:bg-white/20 text-white transition"
                    aria-label="Cerrar"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Content */}
                {submitSuccess ? renderSuccessState() : renderFormContent()}
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
