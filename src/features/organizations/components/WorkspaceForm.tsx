import { useState } from "react";
import type { SubmitEvent } from "react";

import { fieldErrors, getErrorMessage } from "@/shared/api/errors";
import { zodFieldErrors } from "@/shared/lib/form";
import { COUNTRY_OPTIONS, CURRENCY_OPTIONS } from "@/shared/lib/locale-options";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Field } from "@/shared/ui/Field";
import { SelectField } from "@/shared/ui/SelectField";

import { workspaceSchema } from "../schemas";
import type { WorkspaceInput } from "../schemas";

const SERVER_FIELDS: Record<string, keyof WorkspaceInput> = { base_currency: "baseCurrency" };

interface WorkspaceFormProps {
  initial: WorkspaceInput;
  submitLabel: string;
  onSubmit: (values: WorkspaceInput) => void;
  isPending: boolean;
  error: unknown;
  /** Non-admins see the settings read-only. */
  readOnly?: boolean;
  /** Settings page: only enable Save once something changed. */
  requireChanges?: boolean;
  fullWidthSubmit?: boolean;
}

/** Shared by Create workspace (onboarding) and Settings › General. */
export function WorkspaceForm({
  initial,
  submitLabel,
  onSubmit,
  isPending,
  error,
  readOnly = false,
  requireChanges = false,
  fullWidthSubmit = false,
}: WorkspaceFormProps) {
  const [values, setValues] = useState<WorkspaceInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isDirty = (Object.keys(values) as (keyof WorkspaceInput)[]).some((key) => values[key] !== initial[key]);

  const serverErrors: Record<string, string> = {};
  for (const [field, message] of Object.entries(fieldErrors(error))) serverErrors[SERVER_FIELDS[field] ?? field] = message;
  const shown = { ...serverErrors, ...errors };

  const update = (field: keyof WorkspaceInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = workspaceSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    onSubmit(parsed.data);
  }

  const hasFieldErrors = Object.keys(serverErrors).length > 0;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {error !== null && error !== undefined && !hasFieldErrors && <Alert>{getErrorMessage(error)}</Alert>}
      <Field
        label="Workspace name"
        name="name"
        placeholder="Arjun Design Studio"
        value={values.name}
        readOnly={readOnly}
        error={shown.name || undefined}
        onChange={(event) => {
          update("name", event.target.value);
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Country"
          options={COUNTRY_OPTIONS}
          value={values.country}
          disabled={readOnly}
          error={shown.country || undefined}
          onChange={(event) => {
            update("country", event.target.value);
          }}
        />
        <SelectField
          label="Base currency"
          options={CURRENCY_OPTIONS}
          value={values.baseCurrency}
          disabled={readOnly}
          error={shown.baseCurrency || undefined}
          onChange={(event) => {
            update("baseCurrency", event.target.value);
          }}
        />
      </div>
      <p className="-mt-2 text-xs text-secondary">
        Used for dashboards and reports. Changing it later does not convert existing amounts.
      </p>
      {readOnly ? (
        <p className="text-xs text-secondary">Only workspace admins can change these settings.</p>
      ) : (
        <div className={fullWidthSubmit ? "" : "flex justify-end"}>
          <Button type="submit" full={fullWidthSubmit} loading={isPending} disabled={requireChanges && !isDirty}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
