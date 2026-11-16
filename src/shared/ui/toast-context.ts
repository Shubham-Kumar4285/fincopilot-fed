import { createContext, useContext } from "react";

export type ShowToast = (title: string, description?: string) => void;

export const ToastContext = createContext<ShowToast | null>(null);

/** Show a short success message: `toast("Settings saved")`. */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
