import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ToastView } from "./Toast";
import type { ToastMessage } from "./Toast";
import { ToastContext } from "./toast-context";
import type { ShowToast } from "./toast-context";

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  // Hover or focus holds the toast open so it can be read at any pace.
  const [held, setHeld] = useState(false);

  const show = useCallback<ShowToast>((title, description) => {
    setToast({ id: Date.now(), title, description });
  }, []);

  useEffect(() => {
    if (!toast || held) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, TOAST_DURATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast, held]);

  return (
    <ToastContext value={show}>
      {children}
      {toast && (
        <ToastView
          key={toast.id}
          toast={toast}
          onHold={setHeld}
          onDismiss={() => {
            setToast(null);
            setHeld(false);
          }}
        />
      )}
    </ToastContext>
  );
}
