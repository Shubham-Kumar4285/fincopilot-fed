import {
  PendingInvitesBanner,
  useCurrentOrgQuery,
  useMembersQuery,
  useMyRole,
  usePendingInvitesQuery,
} from "@/features/organizations";

import { EmptyDocuments } from "../components/EmptyDocuments";
import { SetupChecklist } from "../components/SetupChecklist";

export function DashboardPage() {
  const org = useCurrentOrgQuery(); // already loaded by the RequireOrg guard
  const members = useMembersQuery();
  const { isAdmin } = useMyRole();
  const invites = usePendingInvitesQuery({ enabled: isAdmin });
  const hasTeammates = (members.data?.total ?? 0) > 1 || (invites.data ?? []).some((invite) => !invite.declined_at);

  return (
    <div className="mx-auto grid w-full max-w-[1120px] gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="lg:col-span-2 empty:hidden">
        <PendingInvitesBanner />
      </div>
      <EmptyDocuments />
      <SetupChecklist orgName={org.data?.name ?? "your workspace"} hasTeammates={hasTeammates} />
    </div>
  );
}
