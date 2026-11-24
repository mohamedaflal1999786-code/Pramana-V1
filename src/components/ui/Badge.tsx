import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "verified" | "pending" | "unverified" | "discrepancy" | "danger";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#eef2ec] text-[var(--ink)] border-[#dce3da]",
    verified: "bg-[#e5f1df] text-[#145a45] border-[#b9d6c4]",
    pending: "bg-[#fbf4e8] text-[#8c591c] border-[#ebd6b8]",
    unverified: "bg-[#f0f3f1] text-[var(--muted)] border-[#dce3da]",
    discrepancy: "bg-[#faeee8] text-[#9c3e21] border-[#f0c8ba]",
    danger: "bg-[#fbebeb] text-[#991b1b] border-[#f5c6c6]",
  };

  const dotColors = {
    default: "bg-[var(--ink)]",
    verified: "bg-[#145a45]",
    pending: "bg-[#8c591c]",
    unverified: "bg-[var(--muted)]",
    discrepancy: "bg-[#9c3e21]",
    danger: "bg-[#991b1b]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[6px] px-[9px] py-[3px] text-[11px] font-[650] tracking-[0.4px] rounded-full border",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-[6px] h-[6px] rounded-full shrink-0", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
