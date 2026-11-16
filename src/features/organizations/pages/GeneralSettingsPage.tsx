import { AlertCircle } from "lucide-react";

import { Button } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SoonBadge } from "@/shared/ui/SoonBadge";
import { StateMessage } from "@/shared/ui/StateMessage";
import { TableSkeleton } from "@/shared/ui/TableSkeleton";
import { useToast } from "@/shared/ui/toast-context";

import { useCurrentOrgQuery, useMyRole, useUpdateOrgMutation } from "../api";
import { SettingsLayout } from "../components/SettingsLayout";
import { WorkspaceForm } from "../components/WorkspaceForm";

export function GeneralSettingsPage() {
  const org = useCurrentOrgQuery();
  const { isAdmin, isPending: rolePending } = useMyRole();
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

      <section className="mt-8 flex max-w-[700px] flex-wrap items-center justify-between gap-6 rounded-card border border-red-200 bg-surface px-6 py-5">
        <div>
          <h2 className="flex items-center gap-2 text-[15px]">
            Delete workspace <SoonBadge />
          </h2>
          <p className="mt-1 text-[13px] text-secondary">
            Permanently delete this workspace and all of its data. This action cannot be undone.
          </p>
          <span className="mt-1 block text-xs text-secondary">Only workspace owners can do this.</span>
        </div>
        <Button variant="destructive" disabled>
          Delete workspace
        </Button>
      </section>
    </SettingsLayout>
  );
}
