"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, X } from "lucide-react";
import { motion as m } from "framer-motion";
import { useScanProduct, ProductoEscaneado } from "@/hooks/useScanProduct";
import { useAgregarReposicionItem } from "@/hooks/useReposicion";
import { useAgregarVencimientoItem } from "@/hooks/useVencimiento";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ScanMode } from "@/types";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-accent-primary mx-auto" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando escáner...</p>
      </div>
    </div>
  ),
});

const FormularioProductoManual = dynamic(
  () => import("@/components/FormularioProductoManual"),
  { ssr: false }
);

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
  const agregarReposicion = useAgregarReposicionItem();
  const agregarVencimiento = useAgregarVencimientoItem();

  useEffect(() => {
    if (!showManualProductModal && productoSeleccionado) {
      if (scanMode === "reposicion") {
        setShowQuantityModal(true);
      } else {
        setShowExpiryModal(true);
      }
    }
  }, [showManualProductModal, productoSeleccionado]);

  const seleccionarProducto = (producto: ProductoEscaneado) => {
    setProductoSeleccionado({
      id: producto.variante.id,
      nombreCompleto: producto.variante.nombreCompleto,
      nombreBase: producto.base.nombre,
      marca: producto.base.marca,
      tamano: producto.variante.tamano,
    });
  };

  const handleScan = async (codigoBarras: string) => {
    const result = await scanProduct(codigoBarras);

    if (result.success && result.producto) {
      seleccionarProducto(result.producto);
      setShowScanner(false);
      if (scanMode === "reposicion") {
        setShowQuantityModal(true);
      } else {
        setShowExpiryModal(true);
      }
    } else {
      setCodigoNoEncontrado(codigoBarras);
      setPendingEAN(codigoBarras);
      setShowScanner(false);
      setShowManualProductModal(true);
    }
  };

  const handleAgregarReposicion = async () => {
    if (productoSeleccionado) {
      await agregarReposicion.mutateAsync({ varianteId: productoSeleccionado.id, cantidad });
      setShowQuantityModal(false);
      setProductoSeleccionado(null);
      setCantidad(1);
      onClose();
    }
  };

  const handleAgregarVencimiento = async () => {
    if (productoSeleccionado && fechaVencimiento) {
      await agregarVencimiento.mutateAsync({
        varianteId: productoSeleccionado.id,
        fechaVencimiento: new Date(fechaVencimiento),
        cantidad: cantidad || undefined,
        lote: lote || undefined,
      });
      setShowExpiryModal(false);
      setProductoSeleccionado(null);
      setCantidad(1);
      setFechaVencimiento("");
      setLote("");
      onClose();
    }
  };

  const handleProductoCreado = async (producto: ProductoEscaneado) => {
    seleccionarProducto(producto);
    setShowManualProductModal(false);
    setPendingEAN(null);
    clearError();
    setCodigoNoEncontrado(null);
  };

  const handleCloseManualModal = () => {
    setShowManualProductModal(false);
    setPendingEAN(null);
    clearError();
    setCodigoNoEncontrado(null);
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
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleScan}
        />
      )}

      <Modal
        isOpen={showQuantityModal}
        onClose={handleCloseQuantityModal}
        title="Cantidad a Reponer"
        size="sm"
      >
        <div className="space-y-4">
          {productoSeleccionado && (
            <div className="p-3 bg-gray-50 dark:bg-dark-card rounded-lg transition-colors">
              <p className="font-bold text-gray-900 dark:text-gray-100">
                {productoSeleccionado.nombreCompleto}
              </p>
              {productoSeleccionado.tamano && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
              className="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-border text-2xl font-bold transition-colors"
            >
              -
            </m.button>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              className="w-20 text-center text-4xl font-extrabold border-b-4 border-accent-primary bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
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

          <Button
            onClick={handleAgregarReposicion}
            disabled={agregarReposicion.isPending}
            className="w-full"
          >
            <Plus size={20} />
            Agregar a Lista
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showExpiryModal}
        onClose={handleCloseExpiryModal}
        title="Registrar Vencimiento"
        size="sm"
      >
        <div className="space-y-4">
          {productoSeleccionado && (
            <div className="p-3 bg-gray-50 dark:bg-dark-card rounded-lg transition-colors">
              <p className="font-bold text-gray-900 dark:text-gray-100">
                {productoSeleccionado.nombreCompleto}
              </p>
              {productoSeleccionado.tamano && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
            disabled={!fechaVencimiento || agregarVencimiento.isPending}
            className="w-full"
          >
            <Plus size={20} />
            Registrar Vencimiento
          </Button>
        </div>
      </Modal>

      {pendingEAN && (
        <FormularioProductoManual
          eanEscaneado={pendingEAN}
          isOpen={showManualProductModal}
          onClose={handleCloseManualModal}
          onProductoCreado={handleProductoCreado}
        />
      )}

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

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-6 max-w-sm w-full mx-4 transition-colors">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-primary mb-4" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Buscando producto...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                Consultando el catálogo
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
