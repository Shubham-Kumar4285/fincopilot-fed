import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ToastView } from "./Toast";
import type { ToastMessage } from "./Toast";
import { ToastContext } from "./toast-context";
import type { ShowToast } from "./toast-context";

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const show = useCallback<ShowToast>((title, description) => {
    setToast({ id: Date.now(), title, description });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, TOAST_DURATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  return (
    <ToastContext value={show}>
      {children}
      {toast && (
        <ToastView
          key={toast.id}
          toast={toast}
          onDismiss={() => {
            setToast(null);
          }}
        />
      )}
    </ToastContext>
  );
}
