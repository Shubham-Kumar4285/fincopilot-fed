import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { buttonClasses } from "./button-classes";
import type { ButtonVariant } from "./button-classes";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  full?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  full = false,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, full, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <LoaderCircle className="animate-spin-fast" size={16} aria-hidden />}
      {children}
    </button>
  );
}
