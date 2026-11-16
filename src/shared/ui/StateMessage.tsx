import type { ReactNode } from "react";

import { Button } from "./Button";

interface StateMessageProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** e.g. "Try again" on error states. */
  actionLabel?: string;
  onAction?: () => void;
}

/** Centered empty / error state used inside cards and tables. */
export function StateMessage({ icon, title, description, actionLabel, onAction }: StateMessageProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 p-8 text-center">
      <span className="mb-1 grid size-11 place-items-center rounded-full bg-muted text-secondary" aria-hidden>
        {icon}
      </span>
      <strong className="text-sm">{title}</strong>
      <p className="max-w-xs text-[13px] text-secondary">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
