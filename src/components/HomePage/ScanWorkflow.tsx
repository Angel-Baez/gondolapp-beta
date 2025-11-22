"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus, X, Bot } from "lucide-react";
import { motion as m } from "framer-motion";
import { useScanProduct } from "@/hooks/useScanProduct";
import { useProductSync } from "@/hooks/useProductSync";
import { useReposicionStore } from "@/store/reposicion";
import { useVencimientoStore } from "@/store/vencimiento";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ScanMode } from "@/types";
import { ProductoCompleto } from "@/services/productos";

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

const FormularioProductoManual = dynamic(
  () => import("@/components/FormularioProductoManual"),
  { ssr: false }
);

// Interface para el producto seleccionado en los modales
interface ProductoSeleccionado {
  id: string;
  nombreCompleto: string;
  nombreBase?: string;
  marca?: string;
  tamano?: string;
}

interface ScanWorkflowProps {
  scanMode: ScanMode;
  onClose: () => void;
}

/**
 * ScanWorkflow component - Maneja el flujo completo de escaneo + modales
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable del flujo completo de escaneo y modales
 * - DIP: Depende de abstracciones (hooks)
 * - OCP: Extensible para nuevos modos de escaneo
 */
export function ScanWorkflow({ scanMode, onClose }: ScanWorkflowProps) {
  const [showScanner, setShowScanner] = useState(true);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showManualProductModal, setShowManualProductModal] = useState(false);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoSeleccionado | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [lote, setLote] = useState("");
  const [pendingEAN, setPendingEAN] = useState<string | null>(null);
  const [codigoNoEncontrado, setCodigoNoEncontrado] = useState<string | null>(null);

  const { scanProduct, loading, error, clearError } = useScanProduct();
  const { syncProductToIndexedDB } = useProductSync();
  const { agregarItem: agregarReposicion } = useReposicionStore();
  const { agregarItem: agregarVencimiento } = useVencimientoStore();

  const handleScan = async (codigoBarras: string) => {
    const result = await scanProduct(codigoBarras);
    
    if (result.success && result.producto) {
      // Guardar la variante completa con info del base
      setProductoSeleccionado({
        id: result.producto.variante.id,
        nombreCompleto: result.producto.variante.nombreCompleto,
        nombreBase: result.producto.base.nombre,
        marca: result.producto.base.marca,
        tamano: result.producto.variante.tamano,
      });

      // Mostrar modal según el modo
      setShowScanner(false);
      if (scanMode === "reposicion") {
        setShowQuantityModal(true);
      } else {
        setShowExpiryModal(true);
      }
    } else {
      // Producto no encontrado → Ofrecer registro manual
      setCodigoNoEncontrado(codigoBarras);
      setPendingEAN(codigoBarras);
      setShowScanner(false);
      setShowManualProductModal(true);
    }
  };

  const handleAgregarReposicion = async () => {
    if (productoSeleccionado) {
      await agregarReposicion(productoSeleccionado.id, cantidad);
      setShowQuantityModal(false);
      setProductoSeleccionado(null);
      setCantidad(1);
      onClose();
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
      onClose();
    }
  };

  const handleProductoCreado = async (producto: ProductoCompleto) => {
    console.log("✅ Producto creado desde MongoDB:", producto);

    // Sincronizar con IndexedDB
    await syncProductToIndexedDB(producto);

    // Configurar el producto para usar en los modales
    setProductoSeleccionado({
      id: producto.variante.id,
      nombreCompleto: producto.variante.nombreCompleto,
      nombreBase: producto.base.nombre,
      marca: producto.base.marca,
      tamano: producto.variante.tamano,
    });

    // Limpiar estados
    setShowManualProductModal(false);
    setPendingEAN(null);
    clearError();
    setCodigoNoEncontrado(null);

    // Abrir modal según modo de escaneo
    if (scanMode === "reposicion") {
      setShowQuantityModal(true);
    } else {
      setShowExpiryModal(true);
    }
  };

  const handleCloseManualModal = () => {
    setShowManualProductModal(false);
    setPendingEAN(null);
    clearError();
    setCodigoNoEncontrado(null);
    onClose();
  };

  const handleCloseQuantityModal = () => {
    setShowQuantityModal(false);
    setProductoSeleccionado(null);
    setCantidad(1);
    onClose();
  };

  const handleCloseExpiryModal = () => {
    setShowExpiryModal(false);
    setProductoSeleccionado(null);
    setCantidad(1);
    setFechaVencimiento("");
    setLote("");
    onClose();
  };

  return (
    <>
      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={onClose}
          onScan={handleScan}
        />
      )}

      {/* Quantity Modal */}
      <Modal
        isOpen={showQuantityModal}
        onClose={handleCloseQuantityModal}
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
        onClose={handleCloseExpiryModal}
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

      {/* Manual Product Modal */}
      {pendingEAN && (
        <FormularioProductoManual
          eanEscaneado={pendingEAN}
          isOpen={showManualProductModal}
          onClose={handleCloseManualModal}
          onProductoCreado={handleProductoCreado}
        />
      )}

      {/* Error Toast */}
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
                  clearError();
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
                  clearError();
                  setCodigoNoEncontrado(null);
                  setShowScanner(true);
                }}
                className="flex-1 py-2 bg-white text-alert-critico rounded-lg text-sm font-bold hover:bg-gray-100 transition"
              >
                Escanear otro
              </button>
              <button
                onClick={() => {
                  clearError();
                  setCodigoNoEncontrado(null);
                  onClose();
                }}
                className="flex-1 py-2 bg-white/20 text-white rounded-lg text-sm font-bold hover:bg-white/30 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-primary mb-4" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                Buscando producto...
              </p>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Consultando la base de datos
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
