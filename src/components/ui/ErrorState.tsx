import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "System Notice",
  message = "An error occurred while loading this section. Under strict authenticity standards, unverified records are held until verified.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-10 text-center bg-[#fdfaf8] border border-[#f0c8ba] rounded-[12px]",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[#faeee8] text-[#9c3e21] flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-[17px] font-[650] text-[var(--ink)] my-0 mb-2">
        {title}
      </h3>
      <p className="text-[13px] text-[var(--muted)] max-w-md my-0 mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry Request
        </Button>
      )}
    </div>
  );
}
