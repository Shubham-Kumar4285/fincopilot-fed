import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link } from "react-router-dom";

import { PATHS } from "@/app/paths";
import { getErrorMessage } from "@/shared/api/errors";
import { zodFieldErrors } from "@/shared/lib/form";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";

import { useForgotPasswordMutation } from "../api";
import { forgotPasswordSchema } from "../schemas";
import { AuthLayout, AuthSwitch } from "./AuthLayout";

/**
 * Owns the whole screen because the heading changes after sending.
 * The backend answers the same for unknown emails, so this never reveals whether an account exists.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const mutation = useForgotPasswordMutation();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(zodFieldErrors(parsed.error).email);
      return;
    }
    mutation.mutate(parsed.data);
  }

  const sent = mutation.isSuccess;

  return (
    <AuthLayout
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={
        sent
          ? `If an account exists for ${email.trim()}, we sent a reset link.`
          : "We'll email you a secure link to choose a new password."
      }
    >
      {sent ? (
        <>
          <Alert tone="success">The link is valid for 30 minutes. Check spam if it doesn't arrive shortly.</Alert>
          <Button
            variant="secondary"
            full
            onClick={() => {
              mutation.reset();
            }}
          >
            Send again
          </Button>
        </>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {mutation.isError && (
            <Alert title="Couldn't send the link.">
              {getErrorMessage(mutation.error, "We couldn't send the reset link. Try again.")}
            </Alert>
          )}
          <Field
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@studio.in"
            value={email}
            error={error}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(undefined);
            }}
          />
          <Button type="submit" full loading={mutation.isPending}>
            Send reset link
          </Button>
        </form>
      )}
      <AuthSwitch>
        <Link to={PATHS.login}>Back to log in</Link>
      </AuthSwitch>
    </AuthLayout>
  );
}
