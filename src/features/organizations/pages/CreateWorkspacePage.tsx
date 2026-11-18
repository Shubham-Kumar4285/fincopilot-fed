import { Mail, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getErrorMessage } from "@/shared/api/errors";
import { PATHS } from "@/shared/config/paths";
import { formatDate } from "@/shared/lib/date";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";

import { useCreateOrgMutation, useOrgsQuery, useRestoreOrgMutation } from "../api";
import { PendingInvitesBanner } from "../components/PendingInvitesBanner";
import { WorkspaceForm } from "../components/WorkspaceForm";

export function CreateWorkspacePage() {
  const navigate = useNavigate();
  const mutation = useCreateOrgMutation();
  const orgs = useOrgsQuery();
  const restore = useRestoreOrgMutation();
  // Workspaces deleted in the last 30 days: the owner can restore them, members are told whom to ask.
  const pending = orgs.data?.filter((org) => org.status === "pending_deletion") ?? [];
  const deleted = pending.filter((org) => org.role === "owner");
  const deletedByOthers = pending.filter((org) => org.role !== "owner");

  return (
    <main className="mx-auto w-[calc(100%-32px)] max-w-[440px] py-12 sm:py-[72px]">
      <span className="block text-[11px] font-semibold tracking-[0.09em] text-secondary">STEP 1 OF 1</span>
      <h1 className="mt-3 text-2xl sm:text-[28px]">Create your workspace</h1>
      <p className="mt-1.5 mb-7 text-secondary">Set the defaults for your books. You can invite your team next.</p>

      <div className="mb-6 empty:hidden">
        <PendingInvitesBanner />
      </div>

      {deletedByOthers.length > 0 && (
        <section className="mb-6 flex flex-col gap-2 rounded-card border border-line bg-surface p-4" aria-label="Workspaces deleted by their owner">
          {deletedByOthers.map((org) => (
            <p key={org.id} className="text-[13px] text-secondary">
              <strong className="text-text">{org.name}</strong> was deleted by {org.owner_name ?? "its owner"}. Contact them
              if you need it back.
            </p>
          ))}
        </section>
      )}

      {deleted.length > 0 && (
        <section className="mb-6 flex flex-col gap-3 rounded-card border border-line bg-surface p-4" aria-label="Deleted workspaces">
          <p className="text-[13px] text-secondary">Deleted a workspace by mistake? You can still restore it.</p>
          {restore.isError && <Alert>{getErrorMessage(restore.error)}</Alert>}
          {deleted.map((org) => (
            <div key={org.id} className="flex items-center justify-between gap-3">
              <span className="flex flex-col text-[13px]">
                <strong>{org.name}</strong>
                {org.purge_after && <span className="text-xs text-secondary">Restore by {formatDate(org.purge_after)}</span>}
              </span>
              <Button
                variant="secondary"
                loading={restore.isPending && restore.variables === org.id}
                onClick={() => {
                  restore.mutate(org.id);
                }}
              >
                <RotateCcw size={14} aria-hidden /> Restore {org.name}
              </Button>
            </div>
          ))}
        </section>
      )}

      <WorkspaceForm
        initial={{ name: "", country: "IN", baseCurrency: "INR" }}
        submitLabel="Create workspace"
        fullWidthSubmit
        isPending={mutation.isPending}
        error={mutation.error}
        onSubmit={(values) => {
          mutation.mutate(values, { onSuccess: () => void navigate(PATHS.dashboard, { replace: true }) });
        }}
      />

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[13px] text-secondary">
        <Mail size={14} aria-hidden /> Have an invite link? Open it from your email.
      </p>
    </main>
  );
}
