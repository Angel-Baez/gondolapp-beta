"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  rightActions?: ReactNode;
}

/** Header compacto para subpantallas (historiales, etc.): back + título, sin tab bar. */
export function PageHeader({ title, subtitle, backHref = "/", rightActions }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-20 glass safe-area-top -mx-4 px-2 mb-2">
      <div className="h-14 flex items-center gap-1">
        <Link
          href={backHref}
          aria-label="Volver"
          className="w-11 h-11 flex items-center justify-center rounded-full text-fg-secondary hover:bg-surface-2 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={22} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-headline text-fg truncate">{title}</h1>
          {subtitle && <p className="text-caption text-fg-secondary truncate">{subtitle}</p>}
        </div>
        {rightActions}
      </div>
    </div>
  );
}
