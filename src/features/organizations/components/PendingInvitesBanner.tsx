import { Mail } from "lucide-react";
import { useState } from "react";

import { useMyInvitesQuery } from "@/features/users";
import type { MyInvite } from "@/features/users";
import { getErrorMessage } from "@/shared/api/errors";
import { Alert } from "@/shared/ui/Alert";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/toast-context";

import { useAcceptMyInviteMutation, useDeclineMyInviteMutation, useSwitchOrg } from "../api";

const ROLE_LABEL: Record<string, string> = { admin: "an admin", member: "a member" };

/** Invites addressed to the signed-in user, with Join / Decline. Renders nothing when there are none. */
export function PendingInvitesBanner() {
  const invites = useMyInvitesQuery();

  if (invites.isPending) return null;
  if (invites.isError) return <Alert>We couldn't check for workspace invites. {getErrorMessage(invites.error)}</Alert>;
  if (invites.data.length === 0) return null;

  return (
    <section aria-label="Workspace invites" className="flex flex-col gap-2">
      {invites.data.map((invite) => (
        <InviteRow key={invite.id} invite={invite} />
      ))}
    </section>
  );
}

function InviteRow({ invite }: { invite: MyInvite }) {
  const [isConfirmingDecline, setIsConfirmingDecline] = useState(false);
  const accept = useAcceptMyInviteMutation();
  const decline = useDeclineMyInviteMutation();
  const switchOrg = useSwitchOrg();
  const toast = useToast();
  const error = accept.error ?? decline.error;
  const who = invite.invited_by_name ?? "Someone";

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={invite.org_name} />
        <p className="min-w-0 flex-1 text-[13px]">
          <Mail size={14} className="mr-1.5 inline text-secondary" aria-hidden />
          {who} invited you to join <strong>{invite.org_name}</strong> as {ROLE_LABEL[invite.role] ?? invite.role}.
        </p>
        {isConfirmingDecline ? (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsConfirmingDecline(false);
              }}
            >
              Keep invite
            </Button>
            <Button
              variant="destructive"
              loading={decline.isPending}
              onClick={() => {
                decline.mutate(invite.id);
              }}
            >
              Decline invite
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={accept.isPending}
              onClick={() => {
                setIsConfirmingDecline(true);
              }}
            >
              Decline
            </Button>
            <Button
              loading={accept.isPending}
              onClick={() => {
                accept.mutate(invite.id, {
                  onSuccess: (result) => {
                    toast("Workspace joined", `Welcome to ${result.org_name}.`);
                    switchOrg(result.org_id);
                  },
                });
              }}
            >
              Join {invite.org_name}
            </Button>
          </div>
        )}
      </div>
      {error && <Alert>{getErrorMessage(error)}</Alert>}
    </div>
  );
}
