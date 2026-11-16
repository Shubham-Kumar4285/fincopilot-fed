import { AlertCircle, Check, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type AlertTone = "error" | "success" | "warning";

const TONES = {
  error: { Icon: AlertCircle, className: "border-red-200 bg-red-50 text-red-800" },
  success: { Icon: Check, className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  warning: { Icon: TriangleAlert, className: "border-amber-200 bg-amber-50 text-amber-800" },
} as const;

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
}

export function Alert({ tone = "error", title, children }: AlertProps) {
  const { Icon, className } = TONES[tone];
  return (
    <div
      className={cn("flex items-start gap-2 rounded-control border px-3 py-2.5 text-xs/normal", className)}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon className="mt-px shrink-0" size={16} aria-hidden />
      <span className="flex flex-col">
        {title && <strong>{title}</strong>}
        {children}
      </span>
    </div>
  );
}
