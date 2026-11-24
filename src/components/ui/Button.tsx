import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-[650] rounded-[7px] transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#ad7b36] focus-visible:outline-offset-[5px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[var(--green)] text-white border border-[var(--green)] hover:bg-[#103e31] hover:border-[#103e31]",
      outline:
        "bg-transparent text-[var(--ink)] border border-[#a9b9ae] hover:bg-[#e9eee6]",
      ghost:
        "bg-transparent text-[var(--ink)] hover:bg-[#e9eee6] border border-transparent",
      danger:
        "bg-[#8b261e] text-white border border-[#8b261e] hover:bg-[#711e17] hover:border-[#711e17]",
      subtle:
        "bg-[#e6ede2] text-[var(--ink)] border border-[var(--line)] hover:bg-[#d8e3d2]",
    };

    const sizeStyles = {
      sm: "text-[13px] py-[8px] px-[14px] gap-[8px]",
      md: "text-[14px] py-[14px] px-[23px] gap-[12px]",
      lg: "text-[16px] py-[16px] px-[28px] gap-[16px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
