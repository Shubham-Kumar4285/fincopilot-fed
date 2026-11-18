import { useState } from "react";

import { getErrorMessage } from "@/shared/api/errors";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Field } from "@/shared/ui/Field";
import { useToast } from "@/shared/ui/toast-context";

import { useTransferOwnershipMutation } from "../api";
import type { OrgMember } from "../api";

interface TransferOwnershipDialogProps {
  member: OrgMember | null;
  orgName: string;
  onClose: () => void;
}

/** The owner types the new owner's email to confirm; they become an admin afterwards. */
export function TransferOwnershipDialog({ member, orgName, onClose }: TransferOwnershipDialogProps) {
  const [typed, setTyped] = useState("");
  const mutation = useTransferOwnershipMutation();
  const toast = useToast();
  const name = member?.full_name ?? member?.email ?? "This member";
  const email = member?.email ?? "";
  const matches = email !== "" && typed.trim().toLowerCase() === email.toLowerCase();

  function close() {
    setTyped("");
    mutation.reset();
    onClose();
  }

  return (
    <Dialog open={member !== null} title="Transfer ownership?" onClose={close}>
      {mutation.isError && <Alert>{getErrorMessage(mutation.error)}</Alert>}
      <p className="text-[13px] text-slate-600">
        {name} becomes the owner of {orgName}, with full control including billing and deleting the workspace. You'll
        become an admin and can't undo this yourself.
      </p>
      <Field
        label={`Type ${email} to confirm`}
        name="confirmEmail"
        type="email"
        autoComplete="off"
        value={typed}
        onChange={(event) => {
          setTyped(event.target.value);
        }}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={!matches}
          loading={mutation.isPending}
          onClick={() => {
            if (!member) return;
            mutation.mutate(member.user_id, {
              onSuccess: () => {
                toast("Ownership transferred", `${name} is now the owner. You're an admin.`);
                close();
              },
            });
          }}
        >
          Transfer ownership
        </Button>
      </div>
    </Dialog>
  );
}
