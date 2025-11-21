"use client";

import FormularioProductoManual from "@/components/FormularioProductoManual";
import { ReposicionList } from "@/components/reposicion/ReposicionList";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { VencimientoList } from "@/components/vencimiento/VencimientoList";
import { db } from "@/lib/db";
import {
  crearProductoManual,
  obtenerOCrearProducto,
} from "@/services/productos";
import { useReposicionStore } from "@/store/reposicion";
import { useVencimientoStore } from "@/store/vencimiento";
import { ScanMode } from "@/types";
import {
  Archive,
  Bot,
  Clock,
  ListChecks,
  Plus,
  Scan,
  Settings,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { motion as m } from "framer-motion";

// 🚀 Lazy load del scanner para reducir bundle inicial
const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white rounded-2xl p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-accent-primary mx-auto" />
        <p className="mt-4 text-sm text-gray-600">Cargando escáner...</p>
      </div>
    </div>
  ),
});

type ActiveView = "reposicion" | "vencimiento";

export default function HomePage() {
  const [activeView, setActiveView] = useState<ActiveView>("reposicion");
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("reposicion");
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [lote, setLote] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoNoEncontrado, setCodigoNoEncontrado] = useState<string | null>(
    null
  );
  const [isUsingIA, setIsUsingIA] = useState(false); // 🆕 Indicador de IA
  const [showManualProductModal, setShowManualProductModal] = useState(false);
  const [pendingEAN, setPendingEAN] = useState<string | null>(null);

  // Estados del formulario manual
  const [manualProductName, setManualProductName] = useState("");
  const [manualProductMarca, setManualProductMarca] = useState("");
  const [manualProductVarianteName, setManualProductVarianteName] =
    useState("");
  const [manualProductTipo, setManualProductTipo] = useState("");
  const [manualProductTamano, setManualProductTamano] = useState("");
  const [manualProductSabor, setManualProductSabor] = useState("");

  const { agregarItem: agregarReposicion } = useReposicionStore();
  const { agregarItem: agregarVencimiento } = useVencimientoStore();

  const handleScan = (codigoBarras: string) => {
    procesarCodigoBarras(codigoBarras);
  };

  const procesarCodigoBarras = async (codigoBarras: string) => {
    setLoading(true);
    setError(null);
    setIsUsingIA(false); // Ya no usamos IA, pero mantenemos el estado

    try {
      console.log("🔍 Buscando producto con código:", codigoBarras);
      console.log("📋 Modo de escaneo actual:", scanMode);

      // Buscar en: IndexedDB → MongoDB → Manual
      const producto = await obtenerOCrearProducto(codigoBarras);

      if (!producto) {
        // Producto no encontrado → Ofrecer registro manual
        setError(
          `Producto con código ${codigoBarras} no encontrado. Regístralo manualmente.`
        );
        setCodigoNoEncontrado(codigoBarras);
        setPendingEAN(codigoBarras);
        setShowManualProductModal(true);
        setLoading(false);
        return;
      }

      console.log("✅ Producto obtenido:", producto);

      // Guardar la variante completa con info del base
      setProductoSeleccionado({
        ...producto.variante,
        nombreBase: producto.base.nombre,
        marca: producto.base.marca,
      });

      // Mostrar modal según el modo
      console.log("🎯 Abriendo modal para modo:", scanMode);
      if (scanMode === "reposicion") {
        setShowQuantityModal(true);
      } else {
        setShowExpiryModal(true);
      }
    } catch (err) {
      console.error("❌ Error al procesar código:", err);
      setError(
        "Error de conexión al buscar el producto. Verifica tu internet e intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarReposicion = async () => {
    if (productoSeleccionado) {
      await agregarReposicion(productoSeleccionado.id, cantidad);
      setShowQuantityModal(false);
      setProductoSeleccionado(null);
      setCantidad(1);
    }
  };

  const handleAgregarVencimiento = async () => {
    if (productoSeleccionado && fechaVencimiento) {
      await agregarVencimiento(
        productoSeleccionado.id,
        new Date(fechaVencimiento),
        cantidad || undefined,
        lote || undefined
      );
      setShowExpiryModal(false);
      setProductoSeleccionado(null);
      setCantidad(1);
      setFechaVencimiento("");
      setLote("");
      setScanMode("reposicion"); // Reset al modo por defecto
    }
  };

  const handleRegistroManual = async () => {
    if (!pendingEAN || !manualProductName.trim()) return;

    try {
      setLoading(true);

      console.log("📦 Datos del formulario antes de enviar:", {
        nombreBase: manualProductName,
        marca: manualProductMarca,
        nombreVariante: manualProductVarianteName,
        tipo: manualProductTipo,
        tamano: manualProductTamano,
        sabor: manualProductSabor,
      });

      const producto = await crearProductoManual(pendingEAN, {
        nombreBase: manualProductName,
        marca: manualProductMarca || undefined,
        nombreVariante: manualProductVarianteName || undefined,
        tipo: manualProductTipo || undefined,
        tamano: manualProductTamano || undefined,
        sabor: manualProductSabor || undefined,
      });

      setProductoSeleccionado({
        ...producto.variante,
        nombreBase: producto.base.nombre,
        marca: producto.base.marca,
      });

      setShowManualProductModal(false);
      setManualProductName("");
      setManualProductMarca("");
      setManualProductVarianteName("");
      setManualProductTipo("");
      setManualProductTamano("");
      setManualProductSabor("");
      setPendingEAN(null);
      setError(null);
      setCodigoNoEncontrado(null);

      // Abrir modal según modo de escaneo
      if (scanMode === "reposicion") {
        setShowQuantityModal(true);
      } else {
        setShowExpiryModal(true);
      }
    } catch (err) {
      console.error("❌ Error al crear producto manual:", err);
      setError("Error al registrar producto. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const openScanner = (mode: ScanMode) => {
    setScanMode(mode);
    setShowScanner(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-lg mx-auto bg-white min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <header className="bg-gray-900 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold flex items-center gap-2">
                {/* ✨ Icono con animación de bounce */}
                <m.div
                  animate={{ 
                    y: [0, -5, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Archive size={28} className="text-accent-primary" />
                </m.div>
                GondolApp
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Gestor de Inventario Inteligente
              </p>
            </div>
            <Link
              href="/admin"
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              {/* ✨ Icono de settings con rotación en hover */}
              <m.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
              >
                <Settings size={20} />
              </m.div>
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </header>

        {/* NAVIGATION TABS */}
        <nav className="p-4 bg-white border-b border-gray-100">
          <div className="flex justify-around bg-gray-100 p-1 rounded-full shadow-inner">
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView("reposicion")}
              className={`flex-1 py-2 rounded-full font-bold transition-all flex items-center justify-center ${
                activeView === "reposicion"
                  ? "bg-accent-primary text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {/* ✨ Icono con animación cuando está activo */}
              <m.div
                animate={
                  activeView === "reposicion"
                    ? {
                        y: [0, -3, 0],
                        rotate: [0, -5, 5, 0],
                      }
                    : { y: 0, rotate: 0 }
                }
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              >
                <ListChecks size={20} className="mr-2" />
              </m.div>
              Reposición
            </m.button>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView("vencimiento")}
              className={`flex-1 py-2 rounded-full font-bold transition-all flex items-center justify-center ${
                activeView === "vencimiento"
                  ? "bg-accent-secondary text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {/* ✨ Icono con animación de reloj cuando está activo */}
              <m.div
                animate={
                  activeView === "vencimiento"
                    ? {
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1],
                      }
                    : { rotate: 0, scale: 1 }
                }
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                <Clock size={20} className="mr-2" />
              </m.div>
              Vencimientos
            </m.button>
          </div>
        </nav>

        {/* ACTION SECTION */}
        <section
          className={`p-4 border-b-4 ${
            activeView === "reposicion"
              ? "border-accent-primary/20"
              : "border-accent-secondary/20"
          }`}
        >
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              openScanner(
                activeView === "reposicion" ? "reposicion" : "vencimiento"
              )
            }
            className={`w-full py-4 rounded-xl text-white font-bold flex items-center justify-center ${
              activeView === "reposicion"
                ? "bg-accent-primary hover:bg-accent-primary/90"
                : "bg-accent-secondary hover:bg-accent-secondary/90"
            } transition shadow-md`}
          >
            {/* ✨ Icono de scanner con pulso */}
            <m.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Scan size={24} className="mr-2" />
            </m.div>
            Escanear Producto
          </m.button>
        </section>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {activeView === "reposicion" ? (
            <ReposicionList />
          ) : (
            <VencimientoList />
          )}
        </main>
      </div>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      {/* Quantity Modal */}
      <Modal
        isOpen={showQuantityModal}
        onClose={() => setShowQuantityModal(false)}
        title="Cantidad a Reponer"
        size="sm"
      >
        <div className="space-y-4">
          {productoSeleccionado && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-bold text-gray-900">
                {productoSeleccionado.nombreCompleto}
              </p>
              {productoSeleccionado.tamano && (
                <p className="text-sm text-gray-500">
                  {productoSeleccionado.tamano}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <m.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCantidad(Math.max(1, cantidad - 1))}
              className="w-12 h-12 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 text-2xl font-bold"
            >
              -
            </m.button>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              className="w-20 text-center text-4xl font-extrabold border-b-4 border-accent-primary focus:outline-none"
            />
            <m.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCantidad(cantidad + 1)}
              className="w-12 h-12 rounded-full bg-accent-primary text-white hover:bg-accent-primary/90 text-2xl font-bold"
            >
              +
            </m.button>
          </div>

          <Button onClick={handleAgregarReposicion} className="w-full">
            <Plus size={20} />
            Agregar a Lista
          </Button>
        </div>
      </Modal>

      {/* Expiry Modal */}
      <Modal
        isOpen={showExpiryModal}
        onClose={() => setShowExpiryModal(false)}
        title="Registrar Vencimiento"
        size="sm"
      >
        <div className="space-y-4">
          {productoSeleccionado && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-bold text-gray-900">
                {productoSeleccionado.nombreCompleto}
              </p>
              {productoSeleccionado.tamano && (
                <p className="text-sm text-gray-500">
                  {productoSeleccionado.tamano}
                </p>
              )}
            </div>
          )}

          <Input
            type="date"
            label="Fecha de Vencimiento"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
          />

          <Input
            type="number"
            label="Cantidad (opcional)"
            value={cantidad}
            onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
            min="1"
          />

          <Input
            type="text"
            label="Lote (opcional)"
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            placeholder="Ej: L12345"
          />

          <Button
            onClick={handleAgregarVencimiento}
            disabled={!fechaVencimiento}
            className="w-full"
          >
            <Plus size={20} />
            Registrar Vencimiento
          </Button>
        </div>
      </Modal>

      {/* 🆕 Modal de Registro Manual con MongoDB */}
      {pendingEAN && (
        <FormularioProductoManual
          eanEscaneado={pendingEAN}
          isOpen={showManualProductModal}
          onClose={() => {
            setShowManualProductModal(false);
            setPendingEAN(null);
            setError(null);
            setCodigoNoEncontrado(null);
          }}
          onProductoCreado={async (producto) => {
            // Producto creado exitosamente en MongoDB
            console.log("✅ Producto creado desde MongoDB:", producto);

            try {
              // 1. Sincronizar ProductoBase con IndexedDB
              const productoBaseExistente = await db.productosBase.get(
                producto.base.id
              );

              if (!productoBaseExistente) {
                await db.productosBase.add({
                  id: producto.base.id,
                  nombre: producto.base.nombre,
                  marca: producto.base.marca,
                  categoria: producto.base.categoria,
                  imagen: undefined,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
                console.log("✅ ProductoBase sincronizado con IndexedDB");
              }

              // 2. Sincronizar ProductoVariante con IndexedDB
              const varianteExistente = await db.productosVariantes.get(
                producto.variante.id
              );

              if (!varianteExistente) {
                await db.productosVariantes.add({
                  id: producto.variante.id,
                  productoBaseId: producto.base.id,
                  codigoBarras: producto.variante.ean,
                  nombreCompleto: producto.variante.nombreCompleto,
                  tipo: producto.variante.tipo,
                  tamano: producto.variante.tamano,
                  sabor: undefined,
                  unidadMedida: undefined,
                  imagen: undefined,
                  createdAt: new Date(),
                });
                console.log("✅ ProductoVariante sincronizado con IndexedDB");
              }

              // 3. Configurar el producto para usar en los modales
              setProductoSeleccionado({
                id: producto.variante.id,
                nombreCompleto: producto.variante.nombreCompleto,
                nombreBase: producto.base.nombre,
                marca: producto.base.marca,
              });

              // 4. Limpiar estados
              setShowManualProductModal(false);
              setPendingEAN(null);
              setError(null);
              setCodigoNoEncontrado(null);

              // 5. Abrir modal según modo de escaneo
              if (scanMode === "reposicion") {
                setShowQuantityModal(true);
              } else {
                setShowExpiryModal(true);
              }
            } catch (error) {
              console.error("❌ Error al sincronizar con IndexedDB:", error);
              alert(
                "Producto creado en MongoDB pero no se pudo sincronizar localmente. Intenta recargar la página."
              );
            }
          }}
        />
      )}

      {/* Error Toast - Actualizado para no mostrar si hay modal manual abierto */}
      {error && !showManualProductModal && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
          <div className="bg-alert-critico text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold mb-1">Producto no encontrado</p>
                <p className="text-sm text-white/90">{error}</p>
                {codigoNoEncontrado && (
                  <p className="text-xs text-white/70 mt-2 font-mono bg-white/10 px-2 py-1 rounded">
                    Código: {codigoNoEncontrado}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setCodigoNoEncontrado(null);
                }}
                className="p-1 rounded-full hover:bg-red-700 transition flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setError(null);
                  setCodigoNoEncontrado(null);
                  setShowScanner(true);
                }}
                className="flex-1 py-2 bg-white text-alert-critico rounded-lg text-sm font-bold hover:bg-gray-100 transition"
              >
                Escanear otro
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setCodigoNoEncontrado(null);
                }}
                className="flex-1 py-2 bg-white/20 text-white rounded-lg text-sm font-bold hover:bg-white/30 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Loading Modal con Indicador de IA */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-primary mb-4" />
                {isUsingIA && (
                  <m.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 360]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity
                    }}
                    className="absolute -top-2 -right-2 bg-purple-500 text-white p-1 rounded-full"
                  >
                    <Bot size={16} />
                  </m.div>
                )}
              </div>
              <p className="text-lg font-bold text-gray-900">
                {isUsingIA ? "Analizando con IA..." : "Buscando producto..."}
              </p>
              <p className="text-sm text-gray-500 mt-2 text-center">
                {isUsingIA
                  ? "Normalizando información del producto"
                  : "Consultando la base de datos"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
