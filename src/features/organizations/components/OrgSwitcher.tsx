import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useMyInvitesQuery } from "@/features/users";
import { PATHS } from "@/shared/config/paths";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/Avatar";

import { useCurrentOrgQuery, useOrgsQuery, useSwitchOrg } from "../api";

const PLAN_LABEL: Record<string, string> = { free: "Free plan", solo: "Solo plan", team: "Team plan", agency: "Agency plan" };
const ROLE_LABEL: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Member" };

/** Sidebar org card: shows the active workspace and switches between the user's workspaces. */
export function OrgSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = useCurrentOrgQuery();
  const orgs = useOrgsQuery();
  const invites = useMyInvitesQuery();
  const switchOrg = useSwitchOrg();
  const inviteCount = invites.data?.length ?? 0;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen]);

  const handleSelect = (orgId: string) => {
    setIsOpen(false);
    onNavigate?.();
    if (orgId !== current.data?.id) switchOrg(orgId);
  };

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 rounded-control p-1 text-left hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Switch workspace (current: ${current.data?.name ?? "loading"})`}
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        <Avatar name={current.data?.name ?? "?"} />
        <span className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-[13px]">{current.data?.name ?? "…"}</strong>
          <span className="text-[11px] text-secondary">{PLAN_LABEL[current.data?.plan_tier ?? ""] ?? "Workspace"}</span>
        </span>
        {inviteCount > 0 && (
          <span
            className="grid size-5 place-items-center rounded-full bg-accent text-[10px] font-semibold text-white"
            aria-label={`${inviteCount} pending ${inviteCount === 1 ? "invite" : "invites"}`}
          >
            {inviteCount}
          </span>
        )}
        <ChevronsUpDown size={14} className="text-secondary" aria-hidden />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label="Workspaces"
          className="absolute top-full left-0 z-40 mt-1 w-[232px] rounded-card border border-line bg-surface p-1.5 shadow-lg"
        >
          <p className="px-2 pt-1 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-secondary">WORKSPACES</p>
          {orgs.isPending && <p className="px-2 py-1.5 text-xs text-secondary">Loading…</p>}
          {orgs.isError && <p className="px-2 py-1.5 text-xs text-danger">Couldn't load your workspaces.</p>}
          {orgs.data?.map((org) => {
            const isCurrent = org.id === current.data?.id;
            return (
              <button
                key={org.id}
                type="button"
                role="menuitemradio"
                aria-checked={isCurrent}
                className={cn("flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left hover:bg-muted", isCurrent && "bg-muted")}
                onClick={() => {
                  handleSelect(org.id);
                }}
              >
                <Avatar name={org.name} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-medium">{org.name}</span>
                  <span className="text-[11px] text-secondary">{ROLE_LABEL[org.role] ?? org.role}</span>
                </span>
                {isCurrent && <Check size={14} className="text-accent" aria-hidden />}
              </button>
            );
          })}
          <div className="my-1 border-t border-line" />
          <Link
            to={PATHS.createWorkspace}
            role="menuitem"
            className="flex items-center gap-2 rounded-control px-2 py-1.5 text-[13px] text-slate-600 hover:bg-muted hover:text-text"
            onClick={() => {
              setIsOpen(false);
              onNavigate?.();
            }}
          >
            <Plus size={14} aria-hidden /> Create workspace
          </Link>
        </div>
      )}
    </div>
  );
}
