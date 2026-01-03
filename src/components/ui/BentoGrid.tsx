import { ReactNode } from 'react';

interface BentoItemProps {
  children: ReactNode;
  span?: 1 | 2;
  className?: string;
}

/**
 * BentoItem - Individual cell in BentoGrid layout
 * 
 * Supports spanning 1 or 2 columns for flexible layouts
 */
export function BentoItem({ children, span = 1, className = '' }: BentoItemProps) {
  return (
    <div 
      className={`
        ${span === 2 ? 'col-span-2' : 'col-span-1'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * BentoGrid - Apple-style grid layout component
 * 
 * Creates a 2-column responsive grid for dashboard-style layouts
 */
export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {children}
    </div>
  );
}
