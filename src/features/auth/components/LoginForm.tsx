import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link } from "react-router-dom";

import { PATHS } from "@/app/paths";
import { fieldErrors, getErrorMessage } from "@/shared/api/errors";
import { zodFieldErrors } from "@/shared/lib/form";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { PasswordField } from "@/shared/ui/PasswordField";

import { useLoginMutation } from "../api";
import { loginSchema } from "../schemas";
import type { LoginInput } from "../schemas";
import { AuthSwitch } from "./AuthLayout";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useLoginMutation();

  const update = (field: keyof LoginInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    mutation.mutate(parsed.data, {
      onSuccess,
      onError: (error) => {
        setErrors(fieldErrors(error));
      },
    });
  }

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {mutation.isError && (
          <Alert title="We couldn't log you in.">
            {getErrorMessage(mutation.error, "Check your email and password, then try again.")}
          </Alert>
        )}
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@studio.in"
          value={values.email}
          error={errors.email || undefined}
          onChange={(event) => {
            update("email", event.target.value);
          }}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={values.password}
          error={errors.password || undefined}
          onChange={(event) => {
            update("password", event.target.value);
          }}
          labelAction={
            <Link className="text-xs font-semibold text-accent-hover hover:underline" to={PATHS.forgotPassword}>
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" full loading={mutation.isPending}>
          Log in
        </Button>
      </form>
      <AuthSwitch>
        No account? <Link to={PATHS.signup}>Sign up</Link>
      </AuthSwitch>
    </>
  );
}
