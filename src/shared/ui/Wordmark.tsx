import { Link } from "react-router-dom";

import { cn } from "@/shared/lib/cn";

interface WordmarkProps {
  /** Home path; passed in because shared/ must not import app/paths. */
  to: string;
  /** Light-on-dark version for the footer. */
  inverted?: boolean;
}

export function Wordmark({ to, inverted = false }: WordmarkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 text-base font-semibold tracking-tight",
        inverted ? "text-white" : "text-text",
      )}
      aria-label="FinCopilot home"
    >
      <span
        className={cn(
          "grid size-[26px] place-items-center rounded-control text-[13px]",
          inverted ? "bg-white text-text" : "bg-text text-white",
        )}
        aria-hidden
      >
        F
      </span>
      <span>FinCopilot</span>
    </Link>
  );
}
