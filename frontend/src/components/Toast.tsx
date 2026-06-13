import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { ensureSentenceEnd } from "../notificationUtils";

type ToastVariant = "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
};

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4500;
const EXIT_MS = 280;

function ToastNotification(props: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const { toast, onDismiss } = props;
  const isSuccess = toast.variant === "success";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        pointer-events-auto flex items-start gap-3 w-full rounded-xl border shadow-lg px-4 py-3
        ${toast.exiting ? "toast-exit" : "toast-enter"}
        ${
          isSuccess
            ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300"
            : "bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-300"
        }
      `}
    >
      <div
        className={`mt-0.5 shrink-0 ${isSuccess ? "text-emerald-500" : "text-red-500"}`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
      </div>
      <p className="flex-1 text-sm font-medium leading-snug pt-0.5">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        aria-label="Zamknij powiadomienie"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider(props: { children: ReactNode }) {
  const { children } = props;
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismissToast = useCallback(
    (id: number) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => removeToast(id), EXIT_MS);
    },
    [removeToast]
  );

  const showToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const formatted = ensureSentenceEnd(message);
      if (!formatted) return;

      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message: formatted, variant, exiting: false }]);

      const timer = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (message: string) => showToast(message, "success"),
    [showToast]
  );

  const showError = useCallback(
    (message: string) => showToast(message, "error"),
    [showToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const contextValue = useMemo(() => ({ showSuccess, showError }), [showSuccess, showError]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-label="Powiadomienia"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-[calc(100%-2rem)] max-w-sm sm:w-96"
      >
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
