"use client";

import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ResultadoImportacion } from "@/types";

export default function ImportarExcel() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        setArchivo(file);
        setResultado(null);
      } else {
        alert("Por favor, selecciona un archivo Excel (.xlsx o .xls)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
      setResultado(null);
    }
  };

  const handleImportar = async () => {
    if (!archivo) return;

    setCargando(true);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append("file", archivo);

      const response = await fetch("/api/productos/importar-excel", {
        method: "POST",
        body: formData,
      });

      const data: ResultadoImportacion = await response.json();
      setResultado(data);

      if (data.success) {
        // Limpiar archivo después de éxito
        setTimeout(() => setArchivo(null), 2000);
      }
    } catch (error) {
      console.error("Error al importar:", error);
      alert("Error al importar el archivo");
    } finally {
      setCargando(false);
    }
  };

  const handleDescargarPlantilla = () => {
    // Crear CSV con las columnas de ejemplo
    const csv = `ProductoBase,Marca,Categoria,TipoVariante,Tamaño,EAN,Sabor,Imagen
Nido,Nestlé,Leche en Polvo,Crecimiento,360g,1234567890123,,
Nido,Nestlé,Leche en Polvo,Forticrece,400g,1234567890456,,
Milex,Nestlé,Leche en Polvo,Kinder Gold,900g,1234567890789,,
Heinz Compota,Heinz,Alimentos Infantiles,Manzana,105g,9876543210456,Manzana,
Coca-Cola,Coca-Cola Company,Refrescos,Regular,2L,7894900011517,,
Leche Gloria,Gloria,Lácteos,Sin Lactosa,1L,7750182003186,,`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-productos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Importar Productos desde Excel
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDescargarPlantilla}
            className="text-cyan-600 border-cyan-600 hover:bg-cyan-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Descargar Plantilla
          </Button>
        </div>

        {/* Zona de Drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-cyan-500 bg-cyan-50"
              : "border-gray-300 hover:border-cyan-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">
            Arrastra tu archivo Excel aquí o{" "}
            <label className="text-cyan-600 hover:text-cyan-700 cursor-pointer font-medium">
              selecciona un archivo
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </label>
          </p>
          <p className="text-sm text-gray-500">Formatos: .xlsx, .xls</p>
        </div>

        {/* Archivo seleccionado */}
        {archivo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-gray-800">{archivo.name}</p>
                <p className="text-sm text-gray-500">
                  {(archivo.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button
              onClick={handleImportar}
              disabled={cargando}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {cargando ? "Importando..." : "Importar"}
            </Button>
          </div>
        )}

        {/* Instrucciones */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">📋 Formato del Excel</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>ProductoBase:</strong> Nombre del producto (ej: "Nido")
            </li>
            <li>
              <strong>Marca:</strong> Marca del producto (ej: "Nestlé")
            </li>
            <li>
              <strong>Categoria:</strong> Categoría (ej: "Leche en Polvo")
            </li>
            <li>
              <strong>TipoVariante:</strong> Tipo de variante (ej:
              "Crecimiento")
            </li>
            <li>
              <strong>Tamaño:</strong> Tamaño con unidad (ej: "360g", "1L")
            </li>
            <li>
              <strong>EAN:</strong> Código de barras
            </li>
            <li>
              <strong>Sabor:</strong> (Opcional) Sabor
            </li>
            <li>
              <strong>Imagen:</strong> (Opcional) URL de imagen
            </li>
          </ul>
        </div>
      </Card>

      {/* Resultados */}
      {resultado && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Resultado de la Importación
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Productos Base
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {resultado.contadores.productosBase}
              </p>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="w-5 h-5 text-cyan-600" />
                <span className="text-sm text-cyan-700 font-medium">
                  Variantes
                </span>
              </div>
              <p className="text-2xl font-bold text-cyan-900">
                {resultado.contadores.variantes}
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-700 font-medium">
                  Duplicados
                </span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">
                {resultado.contadores.duplicados}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700 font-medium">
                  Errores
                </span>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {resultado.contadores.errores}
              </p>
            </div>
          </div>

          {/* Lista de errores */}
          {resultado.errores && resultado.errores.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg max-h-60 overflow-y-auto">
              <h4 className="font-bold text-red-900 mb-2">
                ⚠️ Detalles de errores:
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                {resultado.errores.map((err, idx) => (
                  <li key={idx}>
                    <strong>Fila {err.fila}:</strong> {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultado.contadores.errores === 0 &&
            resultado.contadores.duplicados === 0 && (
              <div className="mt-4 p-4 bg-green-100 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-900 font-medium">
                  ¡Importación completada exitosamente! 🎉
                </p>
              </div>
            )}
        </Card>
      )}
    </div>
  );
}
