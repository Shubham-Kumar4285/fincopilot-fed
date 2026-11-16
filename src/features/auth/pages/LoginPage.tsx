import { useNavigate, useSearchParams } from "react-router-dom";

import { safeNextPath } from "@/shared/config/paths";

import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to your workspace.">
      <LoginForm
        nextParam={params.get("next")}
        onSuccess={() => void navigate(safeNextPath(params.get("next")), { replace: true })}
      />
    </AuthLayout>
  );
}
