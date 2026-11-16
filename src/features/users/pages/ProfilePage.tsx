import { AlertCircle, Trash2 } from "lucide-react";

import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StateMessage } from "@/shared/ui/StateMessage";
import { TableSkeleton } from "@/shared/ui/TableSkeleton";

import { useMeQuery } from "../api";
import { PersonalInfoSection } from "../components/PersonalInfoSection";
import { SoonSection } from "../components/SoonSection";

export function ProfilePage() {
  const me = useMeQuery();

  return (
    <div className="mx-auto w-full max-w-[860px] p-5 sm:p-8">
      <PageHeader title="Profile & security" description="Manage your personal details, password, and active sessions." />

      {me.isPending && <TableSkeleton rows={3} />}
      {me.isError && (
        <StateMessage
          icon={<AlertCircle size={20} />}
          title="Your profile couldn't be loaded"
          description="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void me.refetch()}
        />
      )}
      {/* key: reset the form when the server copy changes */}
      {me.data && <PersonalInfoSection key={me.data.updated_at} me={me.data} />}

      <SoonSection title="Security" description="Choose a strong password you don't use elsewhere.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Current password" type="password" />
          <Field label="New password" type="password" />
          <Field label="Confirm new password" type="password" />
        </div>
        <div className="flex justify-end">
          <Button>Update password</Button>
        </div>
      </SoonSection>

      <SoonSection title="Active sessions" description="Devices currently signed in to your FinCopilot account.">
        <p className="text-[13px] text-secondary">You'll be able to see and revoke signed-in devices here.</p>
        <div>
          <Button variant="secondary">Log out all other sessions</Button>
        </div>
      </SoonSection>

      <SoonSection title="Delete account" description="Permanently remove your account after transferring workspace ownership.">
        <div>
          <Button variant="destructive">
            <Trash2 size={16} aria-hidden /> Delete account
          </Button>
        </div>
      </SoonSection>
    </div>
  );
}
