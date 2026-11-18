import { AlertCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useMeQuery } from "@/features/users";
import { getErrorMessage } from "@/shared/api/errors";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StateMessage } from "@/shared/ui/StateMessage";
import { TableSkeleton } from "@/shared/ui/TableSkeleton";
import { useToast } from "@/shared/ui/toast-context";

import { PATHS } from "@/shared/config/paths";

import { getActiveOrg } from "../active-org";
import {
  useCreateInviteMutation,
  useCurrentOrgQuery,
  useMembersQuery,
  useMyRole,
  usePendingInvitesQuery,
  useSwitchOrg,
  useUpdateMemberRoleMutation,
} from "../api";
import type { OrgMember } from "../api";
import { InviteMemberDialog } from "../components/InviteMemberDialog";
import { MembersTable } from "../components/MembersTable";
import { RemoveMemberDialog } from "../components/RemoveMemberDialog";
import { SettingsLayout } from "../components/SettingsLayout";
import { TransferOwnershipDialog } from "../components/TransferOwnershipDialog";

/**
 * `?org=<id>` (e.g. from "Delete account → Manage members") opens this page for that workspace:
 * switch to it once, then drop the param.
 */
function useOrgFromUrl() {
  const [params, setParams] = useSearchParams();
  const switchOrg = useSwitchOrg();
  const requested = params.get("org");

  useEffect(() => {
    if (!requested) return;
    // Both paths replace the URL without the param.
    if (requested !== getActiveOrg()) switchOrg(requested, PATHS.settingsMembers);
    else setParams({}, { replace: true });
  }, [requested, switchOrg, setParams]);
}

export function MembersSettingsPage() {
  const org = useCurrentOrgQuery();
  const me = useMeQuery();
  const members = useMembersQuery();
  useOrgFromUrl();
  const { role: myRole, isAdmin } = useMyRole();
  const [toTransfer, setToTransfer] = useState<OrgMember | null>(null);
  const changeRole = useUpdateMemberRoleMutation();
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
              myRole={myRole}
              canManage={isAdmin}
              onRemove={setToRemove}
              onTransfer={setToTransfer}
              changingRoleFor={changeRole.isPending ? changeRole.variables.userId : undefined}
              onChangeRole={(member, role) => {
                const name = member.full_name ?? member.email ?? "Member";
                changeRole.mutate(
                  { userId: member.user_id, role },
                  { onSuccess: () => { toast("Role updated", `${name} is now ${role === "admin" ? "an admin" : "a member"}.`); } },
                );
              }}
              reinvitingEmail={reinvite.isPending ? reinvite.variables.email : undefined}
              onReinvite={(invite) => {
                reinvite.mutate(
                  { email: invite.email, role: invite.role === "admin" ? "admin" : "member" },
                  { onSuccess: () => { toast("Invite sent", `We emailed ${invite.email} a new invite.`); } },
                );
              }}
            />
            {changeRole.isError && (
              <div className="border-t border-line p-3">
                <Alert>{getErrorMessage(changeRole.error)}</Alert>
              </div>
            )}
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
      <TransferOwnershipDialog
        member={toTransfer}
        orgName={orgName}
        onClose={() => {
          setToTransfer(null);
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
