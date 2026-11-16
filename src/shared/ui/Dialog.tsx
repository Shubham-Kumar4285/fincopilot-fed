import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Native <dialog>: focus trapping, Escape and the backdrop come from the browser. */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose(); // click on the backdrop
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[440px] rounded-card border border-line bg-surface p-0 text-text backdrop:bg-slate-900/40"
    >
      <div className="flex h-14 items-center justify-between border-b border-line px-5">
        <h2 className="text-base">{title}</h2>
        <button type="button" className="text-secondary hover:text-text" onClick={onClose} aria-label="Close">
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-4 p-5">{children}</div>
    </dialog>
  );
}
