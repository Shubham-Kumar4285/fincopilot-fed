import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/shared/ui/Button";
import { PATHS } from "@/shared/config/paths";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StateMessage } from "@/shared/ui/StateMessage";
import { TableSkeleton } from "@/shared/ui/TableSkeleton";
import { useToast } from "@/shared/ui/toast-context";

import { useCurrentOrgQuery, useMyRole, useUpdateOrgMutation } from "../api";
import { DeleteWorkspaceDialog } from "../components/DeleteWorkspaceDialog";
import { LeaveWorkspaceDialog } from "../components/LeaveWorkspaceDialog";
import { SettingsLayout } from "../components/SettingsLayout";
import { WorkspaceForm } from "../components/WorkspaceForm";

export function GeneralSettingsPage() {
  const org = useCurrentOrgQuery();
  const { role, isAdmin, isPending: rolePending } = useMyRole();
  const [dialog, setDialog] = useState<"delete" | "leave" | null>(null);
  const closeDialog = () => {
    setDialog(null);
  };
  const mutation = useUpdateOrgMutation();
  const toast = useToast();

  return (
    <SettingsLayout>
      <PageHeader title="General" description="Manage your workspace identity and financial defaults." />
      <section className="max-w-[700px] rounded-card border border-line bg-surface p-6">
        {(org.isPending || rolePending) && <TableSkeleton rows={2} />}
        {org.isError && (
          <StateMessage
            icon={<AlertCircle size={20} />}
            title="Settings couldn't be loaded"
            description="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => void org.refetch()}
          />
        )}
        {org.data && !rolePending && (
          <WorkspaceForm
            // Re-initialise the form whenever the saved copy changes.
            key={org.data.updated_at}
            initial={{ name: org.data.name, country: org.data.country ?? "IN", baseCurrency: org.data.base_currency }}
            submitLabel="Save changes"
            requireChanges
            readOnly={!isAdmin}
            isPending={mutation.isPending}
            error={mutation.error}
            onSubmit={(values) => {
              mutation.mutate(values, {
                onSuccess: () => {
                  toast("Settings saved");
                },
              });
            }}
          />
        )}
      </section>

      {org.data && role && (
        <section className="mt-8 flex max-w-[700px] flex-wrap items-center justify-between gap-6 rounded-card border border-red-200 bg-surface px-6 py-5">
          {role === "owner" ? (
            <>
              <div>
                <h2 className="text-[15px]">Delete workspace</h2>
                <p className="mt-1 text-[13px] text-secondary">
                  Members lose access right away. You can restore it for 30 days, then it's deleted for good.
                </p>
                <p className="mt-1 text-xs text-secondary">
                  Want to leave instead?{" "}
                  <Link className="font-semibold text-accent-hover hover:underline" to={PATHS.settingsMembers}>
                    Transfer ownership
                  </Link>{" "}
                  to a member first.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  setDialog("delete");
                }}
              >
                Delete workspace
              </Button>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-[15px]">Leave workspace</h2>
                <p className="mt-1 text-[13px] text-secondary">You'll lose access until someone invites you again.</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  setDialog("leave");
                }}
              >
                Leave workspace
              </Button>
            </>
          )}
        </section>
      )}

      <DeleteWorkspaceDialog open={dialog === "delete"} orgName={org.data?.name ?? ""} onClose={closeDialog} />
      <LeaveWorkspaceDialog open={dialog === "leave"} orgName={org.data?.name ?? ""} onClose={closeDialog} />
    </SettingsLayout>
  );
}
