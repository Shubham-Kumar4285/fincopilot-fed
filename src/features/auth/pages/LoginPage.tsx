import { useNavigate, useSearchParams } from "react-router-dom";

import { safeNextPath } from "@/shared/config/paths";
import { Alert } from "@/shared/ui/Alert";

import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";

/** Shown when the app sent the user here on purpose (see `endSession`). Unknown reasons show nothing. */
const REASON_MESSAGE: Record<string, { title: string; body: string }> = {
  signed_out: { title: "You signed out of this device.", body: "Log in again to continue." },
  account_deleted: {
    title: "Your account was deleted.",
    body: "Changed your mind? Log in within 30 days to restore it.",
  },
};

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = REASON_MESSAGE[params.get("reason") ?? ""];
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to your workspace.">
      {reason && (
        <div className="mb-4">
          <Alert tone="success" title={reason.title}>
            {reason.body}
          </Alert>
        </div>
      )}
      <LoginForm
        nextParam={params.get("next")}
        onSuccess={() => void navigate(safeNextPath(params.get("next")), { replace: true })}
      />
    </AuthLayout>
  );
}
