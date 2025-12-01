"use client";

import React from "react";
import { Modal, Button } from "@/components/ui";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "info" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="space-y-6">
        <p className="text-black dark:text-gray-300">{description}</p>
        <div className="flex justify-end gap-3">
          <Button
            onClick={onCancel}
            className="bg-cyan-400 text-white hover:bg-gray-200 dark:hover:bg-dark-border font-semibold py-2 px-4 rounded-xl transition-colors"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={
              variant === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors"
                : variant === "warning"
                ? "bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-xl transition-colors"
                : "bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors"
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
