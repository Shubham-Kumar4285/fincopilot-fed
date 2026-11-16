import { useNavigate, useSearchParams } from "react-router-dom";

import { PATHS, safeNextPath } from "@/shared/config/paths";

import { AuthLayout } from "../components/AuthLayout";
import { SignupForm } from "../components/SignupForm";

export function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Coming from an invite: the email is fixed and we return to the accept page.
  const lockedEmail = params.get("email") ?? undefined;
  return (
    <AuthLayout title="Create your account" subtitle="Start with 10 documents each month, free.">
      <SignupForm
        lockedEmail={lockedEmail}
        nextParam={params.get("next")}
        onSuccess={() => void navigate(safeNextPath(params.get("next"), PATHS.createWorkspace), { replace: true })}
      />
    </AuthLayout>
  );
}
