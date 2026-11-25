import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("pb-8 mb-8 border-b border-[var(--line)]", className)}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-[760px]">
          {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
          <h1 className="text-[clamp(32px,4vw,52px)] leading-[1.08] tracking-[-0.05em] font-[650] text-[var(--ink)] my-0 mb-3">
            {title}
          </h1>
          {description && (
            <p className="lead text-[17px] md:text-[19px] text-[var(--muted)] my-0">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
