import { useSearchParams } from "react-router-dom";

import { ResetPasswordForm } from "../components/ResetPasswordForm";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  return <ResetPasswordForm token={params.get("token")} />;
}
