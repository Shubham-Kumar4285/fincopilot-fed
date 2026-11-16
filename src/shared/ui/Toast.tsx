import { Check, X } from "lucide-react";

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
}

export function ToastView({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="fixed top-5 left-1/2 z-50 flex w-[340px] max-w-[calc(100%-32px)] -translate-x-1/2 items-start gap-2.5 rounded-card border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-800"
    >
      <Check className="mt-0.5 shrink-0" size={16} aria-hidden />
      <div className="flex flex-1 flex-col text-[13px]">
        <strong>{toast.title}</strong>
        {toast.description && <span>{toast.description}</span>}
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
