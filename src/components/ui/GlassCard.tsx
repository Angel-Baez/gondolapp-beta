import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'medium' | 'strong';
  glow?: boolean;
}

/**
 * GlassCard - Deep Glass Design Component
 * 
 * Provides glassmorphism effect with backdrop blur and transparency
 * Supports multiple variants and optional glow animation
 */
export function GlassCard({ 
  children, 
  className = '', 
  variant = 'medium',
  glow = false 
}: GlassCardProps) {
  const variantClasses = {
    light: 'bg-white/5 border-white/10',
    medium: 'bg-white/10 border-white/15',
    strong: 'bg-white/15 border-white/20',
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-3xl border 
        ${variantClasses[variant]}
        backdrop-blur-2xl shadow-2xl
        ${glow ? 'glow-cyan' : ''}
        ${className}
      `}
    >
      {/* Glass highlight effect */}
      <div className="glass-highlight" />
      {children}
    </div>
  );
}
