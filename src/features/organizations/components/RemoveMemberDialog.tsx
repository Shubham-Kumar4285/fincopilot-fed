import { getErrorMessage } from "@/shared/api/errors";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { useToast } from "@/shared/ui/toast-context";

import { useRemoveMemberMutation } from "../api";
import type { OrgMember } from "../api";

interface RemoveMemberDialogProps {
  member: OrgMember | null;
  orgName: string;
  onClose: () => void;
}

export function RemoveMemberDialog({ member, orgName, onClose }: RemoveMemberDialogProps) {
  const mutation = useRemoveMemberMutation();
  const toast = useToast();
  const name = member?.full_name ?? member?.email ?? "This member";

  function close() {
    mutation.reset();
    onClose();
  }

  return (
    <Dialog open={member !== null} title="Remove member?" onClose={close}>
      {mutation.isError && <Alert>{getErrorMessage(mutation.error)}</Alert>}
      <p className="text-[13px] text-slate-600">
        {name} will immediately lose access to {orgName}.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          loading={mutation.isPending}
          onClick={() => {
            if (!member) return;
            mutation.mutate(member.user_id, {
              onSuccess: () => {
                toast("Member removed", `${name} no longer has access.`);
                close();
              },
            });
          }}
        >
          Remove member
        </Button>
      </div>
    </Dialog>
  );
}
