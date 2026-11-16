import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PATHS } from "@/shared/config/paths";

import { useCreateOrgMutation } from "../api";
import { PendingInvitesBanner } from "../components/PendingInvitesBanner";
import { WorkspaceForm } from "../components/WorkspaceForm";

export function CreateWorkspacePage() {
  const navigate = useNavigate();
  const mutation = useCreateOrgMutation();

  return (
    <main className="mx-auto w-[calc(100%-32px)] max-w-[440px] py-12 sm:py-[72px]">
      <span className="block text-[11px] font-semibold tracking-[0.09em] text-secondary">STEP 1 OF 1</span>
      <h1 className="mt-3 text-2xl sm:text-[28px]">Create your workspace</h1>
      <p className="mt-1.5 mb-7 text-secondary">Set the defaults for your books. You can invite your team next.</p>

      <div className="mb-6 empty:hidden">
        <PendingInvitesBanner />
      </div>

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
