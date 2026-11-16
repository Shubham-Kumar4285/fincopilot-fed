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

import { useSignupMutation } from "../api";
import { PASSWORD_MIN_LENGTH, signupSchema } from "../schemas";
import type { SignupInput } from "../schemas";
import { AuthSwitch } from "./AuthLayout";
import { PasswordStrength } from "./PasswordStrength";

/** Backend 422 field names → form field names. */
const SERVER_FIELDS: Record<string, keyof SignupInput> = { full_name: "fullName", email: "email", password: "password" };

interface SignupFormProps {
  onSuccess: () => void;
  /** Pre-fills and locks the email, e.g. when signing up from an invite link. */
  lockedEmail?: string;
}

export function SignupForm({ onSuccess, lockedEmail }: SignupFormProps) {
  const [values, setValues] = useState<SignupInput>({ fullName: "", email: lockedEmail ?? "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useSignupMutation();

  const update = (field: keyof SignupInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    mutation.mutate(parsed.data, {
      onSuccess,
      onError: (error) => {
        const mapped: Record<string, string> = {};
        for (const [field, message] of Object.entries(fieldErrors(error))) {
          mapped[SERVER_FIELDS[field] ?? field] = message;
        }
        setErrors(mapped);
      },
    });
  }

  return (
    <>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {mutation.isError && (
          <Alert title="We couldn't create your account.">
            {getErrorMessage(mutation.error, "We couldn't create your account. Try again.")}
          </Alert>
        )}
        <Field
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Arjun Mehta"
          value={values.fullName}
          error={errors.fullName || undefined}
          onChange={(event) => {
            update("fullName", event.target.value);
          }}
        />
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="arjun@studio.in"
          value={values.email}
          error={errors.email || undefined}
          readOnly={Boolean(lockedEmail)}
          helper={lockedEmail ? "This invite was sent to this address." : undefined}
          onChange={(event) => {
            update("email", event.target.value);
          }}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
            value={values.password}
            error={errors.password || undefined}
            onChange={(event) => {
              update("password", event.target.value);
            }}
          />
          <PasswordStrength password={values.password} />
        </div>
        <Button type="submit" full loading={mutation.isPending}>
          Create account
        </Button>
      </form>
      <AuthSwitch>
        Have an account? <Link to={PATHS.login}>Log in</Link>
      </AuthSwitch>
    </>
  );
}
