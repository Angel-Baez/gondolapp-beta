"use client";

import { motion as m, AnimatePresence } from "framer-motion";
import { ReactNode, useState } from "react";
import { Scan, Plus, FileSpreadsheet } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

interface FABAction {
  id: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  mainAction: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
  };
  secondaryActions?: FABAction[];
  position?: "bottom-right" | "bottom-center";
  variant?: "primary" | "secondary";
}

/**
 * FloatingActionButton - FAB with expandable menu
 * 
 * ✅ Native-like Features:
 * - Spring animations for expand/collapse
 * - Backdrop blur on open
 * - Staggered action buttons
 * - Haptic feedback
 * - Touch targets >= 44x44px
 */
export function FloatingActionButton({
  mainAction,
  secondaryActions = [],
  position = "bottom-right",
  variant = "primary",
}: FloatingActionButtonProps) {
  const { haptic } = useHaptics();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasSecondaryActions = secondaryActions.length > 0;

  const handleMainClick = () => {
    if (hasSecondaryActions) {
      haptic(isExpanded ? 10 : 20);
      setIsExpanded(!isExpanded);
    } else {
      haptic(25);
      mainAction.onClick();
    }
  };

  const handleActionClick = (action: FABAction) => {
    haptic(25);
    setIsExpanded(false);
    action.onClick();
  };

  const positionClasses = {
    "bottom-right": "right-4 bottom-24",
    "bottom-center": "left-1/2 -translate-x-1/2 bottom-24",
  };

  const variantClasses = {
    primary: "bg-accent-primary hover:bg-accent-primary/90",
    secondary: "bg-accent-secondary hover:bg-accent-secondary/90",
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        {/* Secondary Actions */}
        <AnimatePresence>
          {isExpanded && (
            <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 mb-2">
              {secondaryActions.map((action, index) => (
                <m.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, y: 20 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.05,
                  }}
                  onClick={() => handleActionClick(action)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full shadow-lg touch-manipulation select-none ${
                    action.color || "bg-white dark:bg-dark-card"
                  }`}
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    {action.label}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center">
                    {action.icon}
                  </div>
                </m.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <m.button
          whileTap={{ scale: 0.92 }}
          animate={isExpanded ? { rotate: 45 } : { rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          onClick={handleMainClick}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center touch-manipulation select-none ${
            mainAction.color || variantClasses[variant]
          }`}
          aria-label={mainAction.label}
          aria-expanded={isExpanded}
        >
          {hasSecondaryActions ? (
            <m.div
              animate={isExpanded ? { rotate: 45 } : { rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Plus className="w-7 h-7 text-white" />
            </m.div>
          ) : (
            mainAction.icon
          )}
        </m.button>
      </div>
    </>
  );
}

/**
 * ScanFAB - Pre-configured FAB for scanning with contextual actions
 */
export function ScanFAB({
  onScan,
  onManualAdd,
  onImport,
  variant = "primary",
}: {
  onScan: () => void;
  onManualAdd?: () => void;
  onImport?: () => void;
  variant?: "primary" | "secondary";
}) {
  const actions: FABAction[] = [];

  if (onManualAdd) {
    actions.push({
      id: "manual",
      icon: <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />,
      label: "Agregar Manual",
      onClick: onManualAdd,
    });
  }

  if (onImport) {
    actions.push({
      id: "import",
      icon: <FileSpreadsheet className="w-5 h-5 text-gray-600 dark:text-gray-300" />,
      label: "Importar Excel",
      onClick: onImport,
    });
  }

  // If no secondary actions, just show the scan button
  if (actions.length === 0) {
    return (
      <FloatingActionButton
        mainAction={{
          icon: <Scan className="w-7 h-7 text-white" />,
          label: "Escanear",
          onClick: onScan,
        }}
        variant={variant}
      />
    );
  }

  // Add scan as the first action
  actions.unshift({
    id: "scan",
    icon: <Scan className="w-5 h-5 text-accent-primary" />,
    label: "Escanear Código",
    onClick: onScan,
  });

  return (
    <FloatingActionButton
      mainAction={{
        icon: <Plus className="w-7 h-7 text-white" />,
        label: "Agregar",
        onClick: onScan, // Default to scan when FAB is clicked
      }}
      secondaryActions={actions}
      variant={variant}
    />
  );
}
