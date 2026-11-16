import { AlertCircle, Users } from "lucide-react";
import { useState } from "react";

import { useMeQuery } from "@/features/users";
import { getErrorMessage } from "@/shared/api/errors";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StateMessage } from "@/shared/ui/StateMessage";
import { TableSkeleton } from "@/shared/ui/TableSkeleton";
import { useToast } from "@/shared/ui/toast-context";

import { useCreateInviteMutation, useCurrentOrgQuery, useMembersQuery, useMyRole, usePendingInvitesQuery } from "../api";
import type { OrgMember } from "../api";
import { InviteMemberDialog } from "../components/InviteMemberDialog";
import { MembersTable } from "../components/MembersTable";
import { RemoveMemberDialog } from "../components/RemoveMemberDialog";
import { SettingsLayout } from "../components/SettingsLayout";

export function MembersSettingsPage() {
  const org = useCurrentOrgQuery();
  const me = useMeQuery();
  const members = useMembersQuery();
  const { isAdmin } = useMyRole();
  const invites = usePendingInvitesQuery({ enabled: isAdmin });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toRemove, setToRemove] = useState<OrgMember | null>(null);
  const reinvite = useCreateInviteMutation();
  const toast = useToast();

  const orgName = org.data?.name ?? "this workspace";
  const memberRows = members.data?.members ?? [];
  const inviteRows = invites.data ?? [];
  const onlyMe = memberRows.length <= 1 && inviteRows.length === 0;

  return (
    <SettingsLayout>
      <PageHeader
        title="Members"
        description={`Manage who can access ${orgName}.`}
        action={
          isAdmin ? (
            <Button
              variant="secondary"
              onClick={() => {
                setInviteOpen(true);
              }}
            >
              <Users size={16} aria-hidden /> Invite member
            </Button>
          ) : undefined
        }
      />

      <div className="min-h-[300px] overflow-hidden rounded-card border border-line bg-surface">
        {members.isPending && <TableSkeleton />}
        {members.isError && (
          <StateMessage
            icon={<AlertCircle size={20} />}
            title="Members couldn't be loaded"
            description="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => void members.refetch()}
          />
        )}
        {members.isSuccess && (
          <>
            <MembersTable
              members={memberRows}
              invites={inviteRows}
              myUserId={me.data?.id}
              canManage={isAdmin}
              onRemove={setToRemove}
              reinvitingEmail={reinvite.isPending ? reinvite.variables.email : undefined}
              onReinvite={(invite) => {
                reinvite.mutate(
                  { email: invite.email, role: invite.role === "admin" ? "admin" : "member" },
                  { onSuccess: () => { toast("Invite sent", `We emailed ${invite.email} a new invite.`); } },
                );
              }}
            />
            {reinvite.isError && (
              <div className="border-t border-line p-3">
                <Alert>{getErrorMessage(reinvite.error)}</Alert>
              </div>
            )}
            {onlyMe && (
              <StateMessage
                icon={<Users size={20} />}
                title="No teammates yet"
                description={
                  isAdmin
                    ? "Invite someone to help manage this workspace."
                    : "Only you are in this workspace so far."
                }
                actionLabel={isAdmin ? "Invite member" : undefined}
                onAction={() => {
                  setInviteOpen(true);
                }}
              />
            )}
          </>
        )}
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
        }}
      />
      <RemoveMemberDialog
        member={toRemove}
        orgName={orgName}
        onClose={() => {
          setToRemove(null);
        }}
      />
    </SettingsLayout>
  );
}
