import { Check, X } from "lucide-react";

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
}

interface ToastViewProps {
  toast: ToastMessage;
  onDismiss: () => void;
  /** Called with true while the pointer or focus is inside, false when it leaves. */
  onHold?: (held: boolean) => void;
}

export function ToastView({ toast, onDismiss, onHold }: ToastViewProps) {
  return (
    <div
      role="status"
      onMouseEnter={() => onHold?.(true)}
      onMouseLeave={() => onHold?.(false)}
      onFocus={() => onHold?.(true)}
      onBlur={() => onHold?.(false)}
      className="fixed top-5 left-1/2 z-50 flex w-[340px] max-w-[calc(100%-32px)] -translate-x-1/2 items-start gap-2.5 rounded-card border border-success-line bg-success-soft px-3 py-2.5 text-success-text shadow-[0_4px_16px_rgb(15_23_42/0.08)]"
    >
      <Check className="mt-0.5 shrink-0" size={16} aria-hidden />
      <div className="flex flex-1 flex-col text-[13px]">
        <strong>{toast.title}</strong>
        {toast.description && <span>{toast.description}</span>}
      </div>
      <button type="button" className="grid size-6 place-items-center rounded-control hover:bg-success-line/40" onClick={onDismiss} aria-label="Dismiss">
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}
