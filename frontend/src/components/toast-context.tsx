import React, { createContext, useContext, useState, ReactNode } from "react";
import { Sparkles, X } from "lucide-react";

type ToastType = "xp" | "info" | "success" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
              toast.type === "xp"
                ? "bg-[#0d1a0d]/90 border-[#22c55e]/30 text-[#f0f0f0]"
                : toast.type === "success"
                  ? "bg-[#0d1a0d]/90 border-[#22c55e]/30 text-[#f0f0f0]"
                  : toast.type === "error"
                    ? "bg-[#1a0a0a]/90 border-[#ef4444]/30 text-[#f0f0f0]"
                    : "bg-[#111]/90 border-[#666] text-[#f0f0f0]"
            }`}
          >
            {toast.type === "xp" ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/20 text-[#22c55e] animate-pulse">
                <Sparkles size={16} />
              </div>
            ) : null}
            <div className="flex-1 text-lg font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#eee] hover:text-[#f0f0f0] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
