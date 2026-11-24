import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      options,
      placeholder,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[13px] font-[650] text-[var(--ink)] mb-[6px]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full appearance-none bg-white text-[var(--ink)] text-[14px] border border-[var(--line)] rounded-[7px] py-[12px] pl-[14px] pr-[38px] transition-colors focus:border-[var(--green)] focus:outline-none focus:ring-1 focus:ring-[var(--green)] disabled:bg-[#f2f5f1] disabled:cursor-not-allowed cursor-pointer",
              error && "border-[#b91c1c] focus:border-[#b91c1c] focus:ring-[#b91c1c]",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-[14px] pointer-events-none text-[var(--muted)] flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p className="text-[12px] text-[#b91c1c] mt-[5px]">{error}</p>
        )}
        {!error && helperText && (
          <p className="text-[12px] text-[var(--muted)] mt-[5px]">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
