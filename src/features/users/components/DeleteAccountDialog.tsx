import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link } from "react-router-dom";

import { ApiError, fieldErrors, getErrorMessage } from "@/shared/api/errors";
import { PATHS } from "@/shared/config/paths";
import { zodFieldErrors } from "@/shared/lib/form";
import { maskEmail } from "@/shared/lib/mask-email";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Field } from "@/shared/ui/Field";
import { PasswordField } from "@/shared/ui/PasswordField";

import { useDeleteAccountMutation } from "../api";
import type { useRequestDeleteCodeMutation } from "../api";
import { accountDeleteSchema } from "../schemas";
import type { AccountDeleteInput } from "../schemas";

const CONFIRM_WORD = "DELETE";

interface BlockingOrg {
  org_id: string;
  name: string;
  member_count: number;
}

/** The 409 from the code request lists workspaces the user must hand over first. */
function blockingOrgs(error: unknown): BlockingOrg[] {
  if (!(error instanceof ApiError) || error.status !== 409 || !Array.isArray(error.details.orgs)) return [];
  return error.details.orgs.filter(
    (org): org is BlockingOrg =>
      typeof org === "object" && org !== null && "org_id" in org && "name" in org && "member_count" in org,
  );
}

interface DeleteAccountDialogProps {
  open: boolean;
  email: string;
  /** Code request started by the caller when it opened the dialog. */
  sendCode: ReturnType<typeof useRequestDeleteCodeMutation>;
  /** Asks for a (new) code; the caller restarts `cooldown`. */
  onRequestCode: () => void;
  cooldownSeconds: number;
  onClose: () => void;
}

/** After the code request: a 409 shows which workspaces to transfer or delete first; otherwise the confirm form. */
export function DeleteAccountDialog({
  open,
  email,
  sendCode,
  onRequestCode,
  cooldownSeconds,
  onClose,
}: DeleteAccountDialogProps) {
  const remove = useDeleteAccountMutation();
  const [values, setValues] = useState<AccountDeleteInput>({ otp: "", currentPassword: "" });
  const [confirmWord, setConfirmWord] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof AccountDeleteInput, string>>>({});
  const blockers = blockingOrgs(sendCode.error);
  const hasPassword = sendCode.data?.has_password ?? true;

  function close() {
    remove.reset();
    setValues({ otp: "", currentPassword: "" });
    setConfirmWord("");
    setErrors({});
    onClose();
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = accountDeleteSchema.safeParse(values);
    const next: Partial<Record<keyof AccountDeleteInput, string>> = parsed.success ? {} : zodFieldErrors(parsed.error);
    if (hasPassword && !values.currentPassword) next.currentPassword = "Enter your current password.";
    if (!parsed.success || Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    remove.mutate(parsed.data, {
      onError: (error) => {
        const api = fieldErrors(error);
        setErrors({ otp: api.otp, currentPassword: api.current_password });
      },
    });
  }

  return (
    <Dialog open={open} title="Delete your account?" onClose={close}>
      {sendCode.isPending && <p className="text-[13px] text-secondary">Checking your workspaces…</p>}

      {blockers.length > 0 && (
        <>
          <Alert tone="warning" title="Transfer or delete your workspaces first">
            You own workspaces that other people use. Make someone else the owner, or delete the workspace, then
            come back.
          </Alert>
          <ul className="flex flex-col gap-2">
            {blockers.map((org) => (
              <li key={org.org_id} className="flex items-center justify-between gap-3 text-[13px]">
                <span>
                  <strong>{org.name}</strong>{" "}
                  <span className="text-secondary">· {org.member_count} members</span>
                </span>
                <Link
                  className="text-xs font-semibold text-accent-hover hover:underline"
                  to={`${PATHS.settingsMembers}?org=${encodeURIComponent(org.org_id)}`}
                  onClick={close}
                >
                  Manage members
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
          </div>
        </>
      )}

      {sendCode.isError && blockers.length === 0 && (
        <>
          <Alert>{getErrorMessage(sendCode.error)}</Alert>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
            <Button onClick={onRequestCode}>Try again</Button>
          </div>
        </>
      )}

      {sendCode.data && (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <ul className="list-disc pl-5 text-[13px] text-slate-600">
            <li>You'll be signed out on every device.</li>
            <li>Workspaces you own alone are deleted with your account.</li>
            <li>You'll leave every other workspace.</li>
            <li>You can restore your account by logging in within 30 days. After that it's gone for good.</li>
          </ul>
          {remove.isError && Object.keys(fieldErrors(remove.error)).length === 0 && (
            <Alert>{getErrorMessage(remove.error)}</Alert>
          )}
          <Field
            label="Verification code"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            helper={`Sent to ${maskEmail(email)}.`}
            value={values.otp}
            error={errors.otp}
            onChange={(event) => {
              setValues((current) => ({ ...current, otp: event.target.value }));
              setErrors((current) => ({ ...current, otp: undefined }));
            }}
            labelAction={
              <button
                type="button"
                className="text-xs font-semibold text-accent-hover hover:underline disabled:text-secondary disabled:no-underline"
                disabled={cooldownSeconds > 0 || sendCode.isPending}
                onClick={onRequestCode}
              >
                {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : "Resend code"}
              </button>
            }
          />
          {hasPassword && (
            <PasswordField
              label="Current password"
              name="currentPassword"
              autoComplete="current-password"
              value={values.currentPassword}
              error={errors.currentPassword}
              onChange={(event) => {
                setValues((current) => ({ ...current, currentPassword: event.target.value }));
                setErrors((current) => ({ ...current, currentPassword: undefined }));
              }}
            />
          )}
          <Field
            label={`Type ${CONFIRM_WORD} to confirm`}
            name="confirm"
            autoComplete="off"
            value={confirmWord}
            onChange={(event) => {
              setConfirmWord(event.target.value);
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={confirmWord.trim() !== CONFIRM_WORD}
              loading={remove.isPending}
            >
              Delete account
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
