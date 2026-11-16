import type { ReactNode } from "react";

import { Avatar } from "@/shared/ui/Avatar";

/** Card frame for every invite-accept state (Figma: invite-card). */
export function InviteCard({ orgName, title, description, children }: { orgName?: string; title: string; description: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col gap-4 rounded-card border border-line bg-surface p-7">
      {orgName && (
        <div className="flex items-center gap-3">
          <Avatar name={orgName} size="lg" />
          <strong className="text-[15px]">{orgName}</strong>
        </div>
      )}
      <div>
        <h1 className="text-xl">{title}</h1>
        <p className="mt-1.5 text-[13px] text-slate-600">{description}</p>
      </div>
      {children}
    </div>
  );
}
