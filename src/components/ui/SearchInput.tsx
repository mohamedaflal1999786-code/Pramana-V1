import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Search clinical documents, rules, or alerts...", ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <div className="absolute left-[14px] text-[var(--muted)] pointer-events-none flex items-center">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full bg-white text-[var(--ink)] text-[14px] placeholder:text-[#889b91] border border-[var(--line)] rounded-[7px] py-[11px] pl-[38px] pr-[36px] transition-colors focus:border-[var(--green)] focus:outline-none focus:ring-1 focus:ring-[var(--green)]",
            className
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-[12px] text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded focus:outline-none"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
