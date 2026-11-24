"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, "id">) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback(
    ({ type, title, description, duration = 4500 }: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#145a45]" />,
    error: <AlertCircle className="w-5 h-5 text-[#991b1b]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#8c591c]" />,
    info: <Info className="w-5 h-5 text-[var(--green)]" />,
  };

  const borderStyles = {
    success: "border-[#b9d6c4] bg-[#f2f8f0]",
    error: "border-[#f5c6c6] bg-[#fdf2f2]",
    warning: "border-[#ebd6b8] bg-[#fbf5eb]",
    info: "border-[var(--line)] bg-white",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <aside
        aria-label="Notifications"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto p-4 rounded-[8px] border shadow-lg flex items-start gap-3 transition-all",
              borderStyles[t.type]
            )}
          >
            <div className="shrink-0 mt-0.5">{icons[t.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-[650] text-[var(--ink)] my-0">{t.title}</p>
              {t.description && (
                <p className="text-[12px] text-[var(--muted)] my-0 mt-1">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-[var(--muted)] hover:text-[var(--ink)] p-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
