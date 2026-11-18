import { AlertCircle } from "lucide-react";

import { PageHeader } from "@/shared/ui/PageHeader";
import { StateMessage } from "@/shared/ui/StateMessage";
import { TableSkeleton } from "@/shared/ui/TableSkeleton";

import { useMeQuery } from "../api";
import { DeleteAccountSection } from "../components/DeleteAccountSection";
import { PasswordSection } from "../components/PasswordSection";
import { PersonalInfoSection } from "../components/PersonalInfoSection";
import { SessionsSection } from "../components/SessionsSection";

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

      {me.data && (
        <>
          <PasswordSection email={me.data.email} />
          <SessionsSection />
          <DeleteAccountSection email={me.data.email} />
        </>
      )}
    </div>
  );
}
