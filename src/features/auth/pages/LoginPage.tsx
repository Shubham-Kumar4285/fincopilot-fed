import { useNavigate } from "react-router-dom";

import { PATHS } from "@/app/paths";

import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to your workspace.">
      {/* TODO: navigate to the dashboard once it exists. */}
      <LoginForm onSuccess={() => void navigate(PATHS.landing)} />
    </AuthLayout>
  );
}
