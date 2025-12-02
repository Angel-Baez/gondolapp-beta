"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  filename?: string;
  title?: string;
}

/**
 * Panel de exportación de datos
 * US-110: Exportación de datos
 */
export function ExportPanel({
  isOpen,
  onClose,
  data,
  filename = "export",
  title = "Exportar Datos",
}: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);

  /**
   * Exportar como JSON
   */
  const exportAsJSON = () => {
    setExporting(true);
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exportados ${data.length} registros como JSON`);
      onClose();
    } catch (error) {
      toast.error("Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  /**
   * Exportar como CSV
   */
  const exportAsCSV = () => {
    setExporting(true);
    try {
      if (data.length === 0) {
        toast.error("No hay datos para exportar");
        return;
      }

      // Obtener headers de las keys del primer objeto
      const headers = Object.keys(data[0]);
      
      // Crear filas CSV
      const csvRows = [
        headers.join(","), // Header row
        ...data.map(row => 
          headers.map(header => {
            let cell = row[header];
            
            // Manejar valores especiales
            if (cell === null || cell === undefined) {
              return "";
            }
            if (typeof cell === "object") {
              cell = JSON.stringify(cell);
            }
            
            // Escapar comillas y envolver en comillas si contiene coma o comilla
            cell = String(cell);
            if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
              cell = `"${cell.replace(/"/g, '""')}"`;
            }
            
            return cell;
          }).join(",")
        ),
      ];
      
      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exportados ${data.length} registros como CSV`);
      onClose();
    } catch (error) {
      toast.error("Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <Download className="w-4 h-4 inline mr-2" />
            {data.length} registro(s) listos para exportar
          </p>
        </div>

        {/* Opciones de formato */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Selecciona el formato de exportación:
          </p>

          <button
            onClick={exportAsJSON}
            disabled={exporting}
            className="w-full p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card transition-colors flex items-center gap-4 text-left disabled:opacity-50"
          >
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <FileJson className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">JSON</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Formato estructurado, ideal para desarrollo
              </p>
            </div>
          </button>

          <button
            onClick={exportAsCSV}
            disabled={exporting}
            className="w-full p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card transition-colors flex items-center gap-4 text-left disabled:opacity-50"
          >
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">CSV</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Compatible con Excel y hojas de cálculo
              </p>
            </div>
          </button>
        </div>

        {/* Cancelar */}
        <div className="flex justify-end pt-4 border-t dark:border-dark-border">
          <Button variant="outline" onClick={onClose} disabled={exporting}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
