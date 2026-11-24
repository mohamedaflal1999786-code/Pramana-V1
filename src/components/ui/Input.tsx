import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      isPassword = false,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = React.useState(false);
    const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-[650] text-[var(--ink)] mb-[6px]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-[14px] text-[var(--muted)] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              "w-full bg-white text-[var(--ink)] text-[14px] placeholder:text-[#889b91] border border-[var(--line)] rounded-[7px] py-[12px] px-[14px] transition-colors focus:border-[var(--green)] focus:outline-none focus:ring-1 focus:ring-[var(--green)] disabled:bg-[#f2f5f1] disabled:cursor-not-allowed",
              leftIcon && "pl-[40px]",
              (rightIcon || isPassword) && "pr-[40px]",
              error && "border-[#b91c1c] focus:border-[#b91c1c] focus:ring-[#b91c1c]",
              className
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[14px] text-[var(--muted)] hover:text-[var(--ink)] focus:outline-none focus:text-[var(--ink)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-[14px] text-[var(--muted)] pointer-events-none flex items-center">
                {rightIcon}
              </div>
            )
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-[12px] text-[#b91c1c] mt-[5px]">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-[12px] text-[var(--muted)] mt-[5px]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
