import { ChevronDown } from "lucide-react";
import { useId } from "react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  options: readonly { value: string; label: string }[];
  helper?: string;
  error?: string;
}

export function SelectField({ label, options, helper, error, className, ...selectProps }: SelectFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? helper;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label className="text-[13px] font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>
      <span className="relative">
        <select
          id={id}
          className={cn(
            "h-9 w-full appearance-none rounded-control border border-line-strong bg-surface pr-9 pl-[11px] text-sm text-text focus:border-accent disabled:bg-muted disabled:text-secondary",
            error && "border-danger",
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...selectProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 text-secondary" size={16} aria-hidden />
      </span>
      {message && (
        <span id={messageId} className={cn("text-xs/[1.45]", error ? "text-danger" : "text-secondary")}>
          {message}
        </span>
      )}
    </div>
  );
}
