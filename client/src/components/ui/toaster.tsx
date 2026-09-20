import { X } from "lucide-react";
import { useToast, type ToastVariant } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";

const variantClasses: Record<ToastVariant, string> = {
  default: "bg-foreground text-background",
  success: "bg-success text-success-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:translate-x-0 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg",
            variantClasses[t.variant],
          )}
        >
          <span>{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="opacity-80 transition-opacity hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
