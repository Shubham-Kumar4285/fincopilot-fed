import { cn } from "@/shared/lib/cn";
import { initials } from "@/shared/lib/initials";

const SIZES = { sm: "size-7 text-[10px]", md: "size-8 text-[11px]", lg: "size-11 text-sm" } as const;

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof SIZES }) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full border border-line-strong bg-line font-semibold text-slate-700",
        SIZES[size],
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
