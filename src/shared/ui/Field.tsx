import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, Ref } from "react";

import { cn } from "@/shared/lib/cn";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  helper?: string;
  error?: string;
  /** Right side of the label row, e.g. a "Forgot password?" link. */
  labelAction?: ReactNode;
  /** Inside the input on the right, e.g. a show/hide toggle. */
  inputAction?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Field({ label, helper, error, labelAction, inputAction, className, ref, ...inputProps }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? helper;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-[13px] font-medium text-slate-700" htmlFor={id}>
          {label}
        </label>
        {labelAction}
      </div>
      <span className="relative flex items-center">
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-9 w-full rounded-control border border-line-strong bg-surface px-[11px] text-sm text-text focus:border-accent read-only:bg-muted read-only:text-secondary",
            error && "border-danger",
            inputAction !== undefined && "pr-[58px]",
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...inputProps}
        />
        {inputAction}
      </span>
      {message && (
        <span
          id={messageId}
          className={cn("text-xs/[1.45]", error ? "text-danger" : "text-secondary")}
          role={error ? "alert" : undefined}
        >
          {message}
        </span>
      )}
    </div>
  );
}
