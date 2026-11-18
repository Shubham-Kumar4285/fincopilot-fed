import { useState } from "react";
import type { SubmitEvent } from "react";

import { fieldErrors, getErrorMessage } from "@/shared/api/errors";
import { zodFieldErrors } from "@/shared/lib/form";
import { maskEmail } from "@/shared/lib/mask-email";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { PasswordField } from "@/shared/ui/PasswordField";
import { PasswordStrength } from "@/shared/ui/PasswordStrength";
import { useToast } from "@/shared/ui/toast-context";

import { useChangePasswordMutation, useRequestPasswordCodeMutation } from "../api";
import { passwordChangeSchema } from "../schemas";
import type { PasswordChangeInput } from "../schemas";
import { useCooldown } from "../use-cooldown";
import { ProfileSection } from "./ProfileSection";

const EMPTY: PasswordChangeInput = { otp: "", currentPassword: "", newPassword: "", confirmPassword: "" };
/** Backend field names (422 details) → form fields. */
const API_FIELDS: Record<string, keyof PasswordChangeInput> = {
  otp: "otp",
  current_password: "currentPassword",
  new_password: "newPassword",
};

/**
 * Change (or, for Google-only accounts, set) the password in two steps:
 * 1. email a 6-digit code; the response says whether the account already has a password;
 * 2. enter the code and the passwords. Other devices are signed out on success.
 */
export function PasswordSection({ email }: { email: string }) {
  const [values, setValues] = useState<PasswordChangeInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordChangeInput, string>>>({});
  const sendCode = useRequestPasswordCodeMutation();
  const change = useChangePasswordMutation();
  const cooldown = useCooldown(60);
  const toast = useToast();
  const codeSent = sendCode.data;
  const hasPassword = codeSent?.has_password ?? true;

  const update = (field: keyof PasswordChangeInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function handleSendCode() {
    change.reset();
    sendCode.mutate(undefined, {
      onSuccess: () => {
        cooldown.start();
      },
    });
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = passwordChangeSchema.safeParse(values);
    const next: Partial<Record<keyof PasswordChangeInput, string>> = parsed.success ? {} : zodFieldErrors(parsed.error);
    if (hasPassword && !values.currentPassword) next.currentPassword = "Enter your current password.";
    if (!parsed.success || Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    change.mutate(parsed.data, {
      onSuccess: () => {
        toast(hasPassword ? "Password updated" : "Password set", "Your other devices were signed out.");
        setValues(EMPTY);
        sendCode.reset();
      },
      onError: (error) => {
        const mapped: Partial<Record<keyof PasswordChangeInput, string>> = {};
        for (const [field, message] of Object.entries(fieldErrors(error))) {
          const key = API_FIELDS[field];
          if (key) mapped[key] = message;
        }
        setErrors(mapped);
      },
    });
  }

  if (!codeSent) {
    return (
      <ProfileSection title="Password" description="For your security, we email you a code before changing your password.">
        {sendCode.isError && <Alert>{getErrorMessage(sendCode.error)}</Alert>}
        <div>
          <Button variant="secondary" loading={sendCode.isPending} onClick={handleSendCode}>
            Change password
          </Button>
        </div>
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title={hasPassword ? "Change password" : "Set a password"}
      description={
        hasPassword
          ? "Choose a strong password you don't use elsewhere."
          : "You sign in with Google. Add a password to also sign in with your email."
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Alert tone="success" title="Check your email">
          We sent a 6-digit code to {maskEmail(email)}. It expires in {Math.round(codeSent.expires_in / 60)} minutes.
        </Alert>
        {change.isError && Object.keys(fieldErrors(change.error)).length === 0 && (
          <Alert>{getErrorMessage(change.error)}</Alert>
        )}
        <Field
          label="Verification code"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={values.otp}
          error={errors.otp}
          onChange={(event) => {
            update("otp", event.target.value);
          }}
          labelAction={
            <button
              type="button"
              className="text-xs font-semibold text-accent-hover hover:underline disabled:text-secondary disabled:no-underline"
              disabled={cooldown.secondsLeft > 0 || sendCode.isPending}
              onClick={handleSendCode}
            >
              {cooldown.secondsLeft > 0 ? `Resend in ${cooldown.secondsLeft}s` : "Resend code"}
            </button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {hasPassword && (
            <PasswordField
              label="Current password"
              name="currentPassword"
              autoComplete="current-password"
              value={values.currentPassword}
              error={errors.currentPassword}
              onChange={(event) => {
                update("currentPassword", event.target.value);
              }}
            />
          )}
          <PasswordField
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            value={values.newPassword}
            error={errors.newPassword}
            onChange={(event) => {
              update("newPassword", event.target.value);
            }}
          />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={(event) => {
              update("confirmPassword", event.target.value);
            }}
          />
        </div>
        <PasswordStrength password={values.newPassword} />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setValues(EMPTY);
              setErrors({});
              sendCode.reset();
              change.reset();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" loading={change.isPending}>
            {hasPassword ? "Update password" : "Set password"}
          </Button>
        </div>
      </form>
    </ProfileSection>
  );
}
