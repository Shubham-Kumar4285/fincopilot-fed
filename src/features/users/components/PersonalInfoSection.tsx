import { useState } from "react";
import type { SubmitEvent } from "react";

import { fieldErrors, getErrorMessage } from "@/shared/api/errors";
import { zodFieldErrors } from "@/shared/lib/form";
import { COUNTRY_OPTIONS, CURRENCY_OPTIONS } from "@/shared/lib/locale-options";
import { Alert } from "@/shared/ui/Alert";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { SelectField } from "@/shared/ui/SelectField";
import { SoonBadge } from "@/shared/ui/SoonBadge";
import { useToast } from "@/shared/ui/toast-context";

import { useUpdateMeMutation } from "../api";
import type { Me } from "../api";
import { profileSchema } from "../schemas";
import { ProfileSection } from "./ProfileSection";

export function PersonalInfoSection({ me }: { me: Me }) {
  const [fullName, setFullName] = useState(me.full_name);
  const [error, setError] = useState<string | undefined>();
  const mutation = useUpdateMeMutation();
  const toast = useToast();
  const isDirty = fullName.trim() !== me.full_name;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = profileSchema.safeParse({ fullName });
    if (!parsed.success) {
      setError(zodFieldErrors(parsed.error).fullName);
      return;
    }
    mutation.mutate(parsed.data, {
      onSuccess: () => {
        toast("Profile updated");
      },
      onError: (err) => {
        setError(fieldErrors(err).full_name);
      },
    });
  }

  return (
    <ProfileSection title="Personal information" description="Your details are visible to other workspace members.">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {mutation.isError && !error && <Alert>{getErrorMessage(mutation.error)}</Alert>}
        <Avatar name={me.full_name} size="lg" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            name="fullName"
            autoComplete="name"
            value={fullName}
            error={error}
            onChange={(event) => {
              setFullName(event.target.value);
              setError(undefined);
            }}
          />
          <Field label="Email" value={me.email} readOnly helper="Contact support to change your email." />
          <SelectField label="Country" options={COUNTRY_OPTIONS} disabled helper="Coming soon." />
          <SelectField label="Preferred currency" options={CURRENCY_OPTIONS} disabled helper="Coming soon." />
        </div>
        <p className="flex items-center gap-2 text-xs text-secondary">
          <SoonBadge /> Country and currency preferences aren't saved yet.
        </p>
        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty} loading={mutation.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </ProfileSection>
  );
}
