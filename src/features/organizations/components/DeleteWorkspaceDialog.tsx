import { useState } from "react";

import { getErrorMessage } from "@/shared/api/errors";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Field } from "@/shared/ui/Field";

import { useDeleteOrgMutation } from "../api";

interface DeleteWorkspaceDialogProps {
  open: boolean;
  orgName: string;
  onClose: () => void;
}

/** Owner types the workspace name to confirm (the backend checks it too). */
export function DeleteWorkspaceDialog({ open, orgName, onClose }: DeleteWorkspaceDialogProps) {
  const [typed, setTyped] = useState("");
  const mutation = useDeleteOrgMutation();
  const matches = typed.trim() === orgName;

  function close() {
    setTyped("");
    mutation.reset();
    onClose();
  }

  return (
    <Dialog open={open} title="Delete workspace?" onClose={close}>
      {mutation.isError && <Alert>{getErrorMessage(mutation.error)}</Alert>}
      <ul className="list-disc pl-5 text-[13px] text-slate-600">
        <li>Nobody, including you, can use {orgName} from now on. Members are emailed.</li>
        <li>You can restore it from the workspace switcher for 30 days.</li>
        <li>After that, the workspace and its data are deleted for good.</li>
      </ul>
      <Field
        label={`Type "${orgName}" to confirm`}
        name="confirmName"
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
            mutation.mutate(typed.trim());
          }}
        >
          Delete workspace
        </Button>
      </div>
    </Dialog>
  );
}
