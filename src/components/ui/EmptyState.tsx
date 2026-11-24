import * as React from "react";
import { cn } from "@/lib/utils";
import { FileQuestion } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center bg-white border border-[var(--line)] rounded-[12px]",
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-[#e6ede2] flex items-center justify-center text-[var(--green)] mb-4">
        {icon || <FileQuestion className="w-7 h-7" />}
      </div>
      <h3 className="text-[18px] font-[650] text-[var(--ink)] my-0 mb-2">
        {title}
      </h3>
      <p className="text-[14px] text-[var(--muted)] max-w-md my-0 mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
