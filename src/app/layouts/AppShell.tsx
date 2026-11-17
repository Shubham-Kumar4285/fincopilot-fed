import {
  BarChart3,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ReceiptText,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { NavLink, Outlet, useLocation, useMatches, useNavigate } from "react-router-dom";

import { useLogoutMutation } from "@/features/auth";
import { OrgSwitcher } from "@/features/organizations";
import { useMeQuery } from "@/features/users";
import { PATHS } from "@/shared/config/paths";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/Avatar";
import { SoonBadge } from "@/shared/ui/SoonBadge";

const SOON_ITEMS = [
  { icon: FileText, label: "Documents" },
  { icon: ReceiptText, label: "Invoices" },
  { icon: CircleDollarSign, label: "Transactions" },
  { icon: BarChart3, label: "Reports" },
  { icon: MessageSquare, label: "Chat" },
] as const;

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex h-9 items-center gap-2.5 rounded-control px-2.5 text-[13px] font-medium",
    isActive ? "bg-muted text-text" : "text-slate-600 hover:bg-muted hover:text-text",
  );

/** Route `handle: { title }` sets the top-bar title. */
function usePageTitle(): string {
  const matches = useMatches();
  for (const match of [...matches].reverse()) {
    const handle = match.handle as { title?: string } | undefined;
    if (handle?.title) return handle.title;
  }
  return "FinCopilot";
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = usePageTitle();
  const me = useMeQuery();
  const logout = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const inSettings = location.pathname.startsWith("/app/settings");
  const isDesktop = useMediaQuery("(min-width: 768px)", true);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerHidden = !isDesktop && !drawerOpen;

  useEffect(() => {
    document.title = title === "FinCopilot" ? title : `${title} · FinCopilot`;
  }, [title]);

  useEffect(() => {
    if (!drawerOpen) return;
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [drawerOpen]);

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-canvas md:pl-[240px]">
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-20 bg-slate-900/30 md:hidden"
          onClick={closeDrawer}
        />
      )}
      <aside
        ref={drawerRef}
        inert={drawerHidden}
        aria-hidden={drawerHidden || undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col border-r border-line bg-surface transition-transform motion-reduce:transition-none md:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-1.5 border-b border-line px-2.5">
          <OrgSwitcher onNavigate={closeDrawer} />
          <button type="button" className="grid size-8 place-items-center rounded-control text-secondary hover:bg-muted hover:text-text md:hidden" aria-label="Close navigation" onClick={closeDrawer}>
            <X size={18} aria-hidden />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-2.5 py-3.5" aria-label="Main">
          <NavLink to={PATHS.dashboard} end className={navClass} onClick={closeDrawer}>
            <LayoutDashboard size={16} aria-hidden /> Dashboard
          </NavLink>
          {SOON_ITEMS.map(({ icon: Icon, label }) => (
            <span key={label} className="flex h-9 items-center gap-2.5 px-2.5 text-[13px] text-slate-400" aria-disabled>
              <Icon size={16} aria-hidden />
              <span className="flex-1">{label}</span>
              <SoonBadge />
            </span>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-line p-2.5">
          <NavLink
            to={PATHS.settingsGeneral}
            className={() => navClass({ isActive: inSettings })}
            onClick={closeDrawer}
          >
            <Settings size={16} aria-hidden /> Settings
          </NavLink>
          <div className="flex items-center gap-2 rounded-control px-1.5 py-1.5">
            <NavLink to={PATHS.profile} className="flex min-w-0 flex-1 items-center gap-2" onClick={closeDrawer}>
              <Avatar name={me.data?.full_name ?? "?"} />
              <span className="flex min-w-0 flex-col">
                <strong className="truncate text-[13px]">{me.data?.full_name ?? "…"}</strong>
                <small className="truncate text-[11px] text-secondary">{me.data?.email}</small>
              </span>
            </NavLink>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-control text-secondary hover:bg-muted hover:text-text"
              aria-label="Log out"
              disabled={logout.isPending}
              onClick={() => {
                logout.mutate(undefined, { onSettled: () => void navigate(PATHS.login, { replace: true }) });
              }}
            >
              <LogOut size={16} aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <button
            ref={menuButtonRef}
            type="button"
            className="grid size-9 place-items-center rounded-control text-slate-600 hover:bg-muted md:hidden"
            aria-label="Open navigation"
            onClick={() => {
              setDrawerOpen(true);
            }}
          >
            <Menu size={18} aria-hidden />
          </button>
          <h1 className="text-base">{title}</h1>
          <NavLink to={PATHS.profile} className="ml-auto" aria-label="Your profile">
            <Avatar name={me.data?.full_name ?? "?"} size="sm" />
          </NavLink>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
