import { createContext, useContext, useCallback, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const styles = {
  success: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  error: { icon: XCircle, cls: "border-rose-200 bg-rose-50 text-rose-800" },
  info: { icon: Info, cls: "border-mist bg-mist text-sage-dark" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "success", ttl = 3500) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list, { id, message, type }]);
      setTimeout(() => dismiss(id), ttl);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error", 5000),
      info: (m) => push(m, "info"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
        {toasts.map((t) => {
          const { icon: Icon, cls } = styles[t.type] || styles.info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-lg ${cls}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 transition hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
