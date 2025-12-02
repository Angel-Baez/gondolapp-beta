"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Code, Copy, X } from "lucide-react";
import toast from "react-hot-toast";

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: Record<string, any>;
  title?: string;
}

/**
 * Vista JSON raw de un documento
 * US-108: Vista JSON del documento
 */
export function DocumentViewer({
  isOpen,
  onClose,
  document,
  title = "Documento JSON",
}: DocumentViewerProps) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(document, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success("JSON copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Error al copiar");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Code className="w-4 h-4" />
            <span>Vista de solo lectura</span>
            {copied && (
              <span className="sr-only" role="status" aria-live="polite">
                JSON copiado al portapapeles
              </span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleCopy}
            className="!py-1 !px-3 text-sm"
          >
            <Copy className="w-4 h-4 mr-1" />
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        </div>

        {/* JSON Content */}
        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-auto max-h-[60vh]">
          <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
            {jsonString}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t dark:border-dark-border">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
