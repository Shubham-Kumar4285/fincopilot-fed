import { cn } from "@/shared/lib/cn";

import { PASSWORD_MIN_LENGTH } from "../schemas";

/** UI guidance only: counts how many of four simple rules the password meets. */
function strengthOf(password: string): number {
  if (!password) return 0;
  return [
    password.length >= PASSWORD_MIN_LENGTH,
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
    /[a-z]/.test(password) && /[A-Z]/.test(password),
  ].filter(Boolean).length;
}

export function PasswordStrength({ password }: { password: string }) {
  const level = strengthOf(password);
  const activeColor = level >= 3 ? "bg-accent" : "bg-warning";

  return (
    <div aria-live="polite">
      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((segment) => (
          <i key={segment} className={cn("h-[3px] rounded-sm", segment <= level ? activeColor : "bg-line")} />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-secondary">
        {level === 4 ? "Strong password." : `Use ${PASSWORD_MIN_LENGTH}+ characters with a number and symbol.`}
      </p>
    </div>
  );
}
