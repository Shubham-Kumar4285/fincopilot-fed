import { cn } from "@/shared/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const BASE =
  "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-control border border-transparent px-3.5 text-[13px] font-semibold transition hover:enabled:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none motion-reduce:hover:enabled:translate-y-0";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-white hover:enabled:border-accent-hover hover:enabled:bg-accent-hover",
  secondary: "border-line-strong bg-surface text-text hover:enabled:bg-muted",
  ghost: "bg-transparent text-text hover:enabled:bg-muted",
  destructive: "bg-danger text-white hover:enabled:bg-danger-hover",
};

/** Class string for the button look, for links that must look like buttons. */
export function buttonClasses(variant: ButtonVariant = "primary", full = false, className?: string): string {
  return cn(BASE, VARIANTS[variant], full && "w-full", className);
}
