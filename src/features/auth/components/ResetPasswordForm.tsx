import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link } from "react-router-dom";

import { PATHS } from "@/shared/config/paths";
import { ApiError, getErrorMessage } from "@/shared/api/errors";
import { zodFieldErrors } from "@/shared/lib/form";
import { Alert } from "@/shared/ui/Alert";
import { buttonClasses } from "@/shared/ui/button-classes";
import { Button } from "@/shared/ui/Button";
import { PasswordField } from "@/shared/ui/PasswordField";
import { PasswordStrength } from "@/shared/ui/PasswordStrength";

import { useResetPasswordMutation } from "../api";
import { resetPasswordSchema } from "../schemas";
import type { ResetPasswordInput } from "../schemas";
import { AuthLayout, AuthSwitch } from "./AuthLayout";

/** Owns the whole screen: heading changes for invalid-link and success states. */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const [values, setValues] = useState<ResetPasswordInput>({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useResetPasswordMutation();

  const update = (field: keyof ResetPasswordInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resetPasswordSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    if (token) mutation.mutate({ token, password: parsed.data.password });
  }

  // A 4xx means the token itself is bad (expired, used, unknown).
  const linkInvalid =
    !token || (mutation.error instanceof ApiError && mutation.error.status >= 400 && mutation.error.status < 500 && mutation.error.status !== 422);

  if (linkInvalid) {
    return (
      <AuthLayout title="This link doesn't work" subtitle="Reset links expire after 30 minutes and can be used once.">
        <Link to={PATHS.forgotPassword} className={buttonClasses("primary", true)}>
          Send a new link
        </Link>
        <AuthSwitch>
          <Link to={PATHS.login}>Back to log in</Link>
        </AuthSwitch>
      </AuthLayout>
    );
  }

  if (mutation.isSuccess) {
    return (
      <AuthLayout title="Password updated" subtitle="You've been signed out everywhere. Log in with your new password.">
        <Link to={PATHS.login} className={buttonClasses("primary", true)}>
          Log in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Use at least 8 characters you don't use elsewhere.">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {mutation.isError && <Alert title="Couldn't update your password.">{getErrorMessage(mutation.error)}</Alert>}
        <div className="flex flex-col gap-2">
          <PasswordField
            label="New password"
            name="password"
            autoComplete="new-password"
            value={values.password}
            error={errors.password || undefined}
            onChange={(event) => {
              update("password", event.target.value);
            }}
          />
          <PasswordStrength password={values.password} />
        </div>
        <PasswordField
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          value={values.confirmPassword}
          error={errors.confirmPassword || undefined}
          onChange={(event) => {
            update("confirmPassword", event.target.value);
          }}
        />
        <Button type="submit" full loading={mutation.isPending}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
