import { getErrorMessage } from "@/shared/api/errors";
import { formatDate } from "@/shared/lib/date";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";

interface RestoreWorkspaceDialogProps {
  /** The deleted workspace to confirm; null keeps the dialog closed. */
  org: { name: string; purge_after?: string | null } | null;
  isRestoring: boolean;
  error: unknown;
  onRestore: () => void;
  onClose: () => void;
}

/** A deleted workspace is only restored after the owner confirms; selecting it never restores it. */
export function RestoreWorkspaceDialog({ org, isRestoring, error, onRestore, onClose }: RestoreWorkspaceDialogProps) {
  return (
    <Dialog open={org !== null} title={`Restore ${org?.name ?? "workspace"}?`} onClose={onClose}>
      <p className="text-[13px] text-slate-600">
        This workspace was deleted
        {org?.purge_after ? (
          <>
            {" "}and will be permanently removed on <strong>{formatDate(org.purge_after)}</strong>
          </>
        ) : null}
        . Restoring it cancels the deletion and makes it usable again for you and its members.
      </p>
      {error ? <Alert>{getErrorMessage(error)}</Alert> : null}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={isRestoring} onClick={onRestore}>
          Restore workspace
        </Button>
      </div>
    </Dialog>
  );
}
