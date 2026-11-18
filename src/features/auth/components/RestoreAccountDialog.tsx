import { formatDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";

interface RestoreAccountDialogProps {
  /** ISO deadline from the 403 `account_pending_deletion` response; null keeps the dialog closed. */
  restoreUntil: string | null;
  isRestoring: boolean;
  onRestore: () => void;
  onClose: () => void;
}

export function RestoreAccountDialog({ restoreUntil, isRestoring, onRestore, onClose }: RestoreAccountDialogProps) {
  return (
    <Dialog open={restoreUntil !== null} title="Restore your account?" onClose={onClose}>
      <p className="text-[13px] text-slate-600">
        This account was deleted. You can restore it until <strong>{restoreUntil ? formatDate(restoreUntil) : ""}</strong>
        . After that, its personal data is erased for good.
      </p>
      <p className="text-[13px] text-slate-600">
        Workspaces you owned alone come back with it. Workspaces you left won't: ask their owners to invite you again.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={isRestoring} onClick={onRestore}>
          Restore and log in
        </Button>
      </div>
    </Dialog>
  );
}
