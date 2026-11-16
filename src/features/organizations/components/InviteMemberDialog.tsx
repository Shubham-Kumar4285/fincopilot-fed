import { Check } from "lucide-react";
import { useState } from "react";
import type { SubmitEvent } from "react";

import { fieldErrors, getErrorMessage } from "@/shared/api/errors";
import { zodFieldErrors } from "@/shared/lib/form";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Field } from "@/shared/ui/Field";
import { SelectField } from "@/shared/ui/SelectField";

import { useCreateInviteMutation } from "../api";
import { INVITE_ROLES, inviteSchema } from "../schemas";
import type { InviteInput } from "../schemas";

const EMPTY: InviteInput = { email: "", role: "member" };

export function InviteMemberDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [values, setValues] = useState<InviteInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useCreateInviteMutation();

  function close() {
    setValues(EMPTY);
    setErrors({});
    mutation.reset();
    onClose();
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = inviteSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    mutation.mutate(parsed.data, {
      onError: (error) => {
        setErrors(fieldErrors(error));
      },
    });
  }

  return (
    <Dialog open={open} title={mutation.isSuccess ? "Invitation sent" : "Invite member"} onClose={close}>
      {mutation.isSuccess ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-accent" aria-hidden>
            <Check size={18} />
          </span>
          <p className="text-[13px] text-slate-600">
            An invitation was sent to {mutation.data.email}. It will expire in 7 days.
          </p>
          <Button full onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {/* e.g. the plan-tier 403: "Team tier or higher required to invite members." */}
          {mutation.isError && Object.keys(errors).length === 0 && <Alert>{getErrorMessage(mutation.error)}</Alert>}
          <Field
            label="Email"
            type="email"
            name="email"
            placeholder="teammate@studio.in"
            value={values.email}
            error={errors.email || undefined}
            onChange={(event) => {
              setValues((current) => ({ ...current, email: event.target.value }));
              setErrors({});
            }}
          />
          <SelectField
            label="Role"
            options={INVITE_ROLES}
            value={values.role}
            helper="Admins can manage members and workspace settings."
            onChange={(event) => {
              const role = inviteSchema.shape.role.safeParse(event.target.value);
              if (role.success) setValues((current) => ({ ...current, role: role.data }));
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Send invite
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
