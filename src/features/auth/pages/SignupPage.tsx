import { useNavigate } from "react-router-dom";

import { PATHS } from "@/app/paths";

import { AuthLayout } from "../components/AuthLayout";
import { SignupForm } from "../components/SignupForm";

export function SignupPage() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Create your account" subtitle="Start with 10 documents each month, free.">
      {/* TODO: navigate to create-org / dashboard once they exist. */}
      <SignupForm onSuccess={() => void navigate(PATHS.landing)} />
    </AuthLayout>
  );
}
