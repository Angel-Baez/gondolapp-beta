"use client";

import { motion as m } from "framer-motion";
import { ChevronDown, ChevronUp, LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  count: number;
  icon: LucideIcon;
  colorClass: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  showToggleButton?: boolean;
}

export function SectionHeader({
  title,
  count,
  icon: Icon,
  colorClass,
  isExpanded,
  onToggle,
  showToggleButton,
}: SectionHeaderProps) {
  return (
    <div className={`${colorClass} p-3 sm:p-4 rounded-t-xl`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Icon size={20} className="text-white sm:w-6 sm:h-6 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap">
            {count} producto{count !== 1 ? "s" : ""}
          </span>
          {showToggleButton && onToggle && (
            <m.button
              onClick={onToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
              aria-label={isExpanded ? "Colapsar sección" : "Expandir sección"}
            >
              {isExpanded ? (
                <ChevronUp size={20} className="text-white" />
              ) : (
                <ChevronDown size={20} className="text-white" />
              )}
            </m.button>
          )}
        </div>
      </div>
    </div>
  );
}
