import { getErrorMessage } from "@/shared/api/errors";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";

import { useLeaveOrgMutation } from "../api";

interface LeaveWorkspaceDialogProps {
  open: boolean;
  orgName: string;
  onClose: () => void;
}

export function LeaveWorkspaceDialog({ open, orgName, onClose }: LeaveWorkspaceDialogProps) {
  const mutation = useLeaveOrgMutation();

  function close() {
    mutation.reset();
    onClose();
  }

  return (
    <Dialog open={open} title="Leave workspace?" onClose={close}>
      {mutation.isError && <Alert>{getErrorMessage(mutation.error)}</Alert>}
      <p className="text-[13px] text-slate-600">
        You'll lose access to {orgName} right away. Anything you added stays in the workspace. To come back, an admin
        has to invite you again.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          loading={mutation.isPending}
          onClick={() => {
            mutation.mutate();
          }}
        >
          Leave workspace
        </Button>
      </div>
    </Dialog>
  );
}
