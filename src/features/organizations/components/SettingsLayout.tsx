import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { PATHS } from "@/shared/config/paths";
import { cn } from "@/shared/lib/cn";
import { SoonBadge } from "@/shared/ui/SoonBadge";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex h-9 shrink-0 items-center rounded-control px-3 text-[13px] font-medium",
    isActive ? "bg-muted text-text" : "text-slate-600 hover:bg-muted hover:text-text",
  );

/** Settings sub-navigation + content area (Figma: SettingsLayout). */
export function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1120px] md:min-h-[calc(100vh-64px)] md:grid-cols-[200px_minmax(0,1fr)]">
      <nav
        aria-label="Settings"
        className="flex gap-1 overflow-x-auto border-b border-line px-5 py-3 md:flex-col md:border-r md:border-b-0 md:py-8 md:pr-6 md:pl-0"
      >
        <NavLink to={PATHS.settingsGeneral} className={linkClass}>
          General
        </NavLink>
        <NavLink to={PATHS.settingsMembers} className={linkClass}>
          Members
        </NavLink>
        {["Billing", "Audit log"].map((label) => (
          <span key={label} className="flex h-9 shrink-0 items-center gap-2 px-3 text-[13px] text-slate-400" aria-disabled>
            {label} <SoonBadge />
          </span>
        ))}
      </nav>
      <div className="min-w-0 p-5 sm:p-8">{children}</div>
    </div>
  );
}
