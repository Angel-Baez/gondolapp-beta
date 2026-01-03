import { motion as m } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassPillProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'cyan' | 'purple' | 'lime';
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * GlassPill - Deep Glass Design Button Component
 * 
 * Pill-shaped button with glassmorphism and neon glow effects
 * Supports multiple color variants with animated interactions
 */
export function GlassPill({ 
  children, 
  onClick, 
  variant = 'cyan',
  icon,
  disabled = false,
  className = ''
}: GlassPillProps) {
  const variantClasses = {
    cyan: 'bg-neon-cyan/20 border-neon-cyan/30 text-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]',
    purple: 'bg-neon-purple/20 border-neon-purple/30 text-neon-purple shadow-[0_0_20px_rgba(180,122,255,0.3)]',
    lime: 'bg-neon-lime/20 border-neon-lime/30 text-neon-lime shadow-[0_0_20px_rgba(204,255,0,0.3)]',
  };

  return (
    <m.button
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex items-center justify-center gap-3
        px-8 py-4 rounded-full border-2
        backdrop-blur-xl font-bold text-lg
        transition-all duration-200
        ${variantClasses[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {children}
    </m.button>
  );
}
