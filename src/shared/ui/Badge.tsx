import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-line bg-muted text-slate-600",
  success: "border-success-line bg-success-soft text-success-text",
  warning: "border-warning-line bg-warning-soft text-warning-text",
  danger: "border-danger-line bg-danger-soft text-danger-text",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      // `badge badge-<tone>` are hooks for the ledger animation in styles/ledger.css.
      className={cn(
        `badge badge-${tone}`,
        "inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full border px-2 text-[11px] font-semibold",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
