import { AlertCircle, Monitor } from "lucide-react";
import { useState } from "react";

import { getErrorMessage } from "@/shared/api/errors";
import { formatDateTime } from "@/shared/lib/date";
import { Alert } from "@/shared/ui/Alert";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { StateMessage } from "@/shared/ui/StateMessage";
import { TableSkeleton } from "@/shared/ui/TableSkeleton";
import { useToast } from "@/shared/ui/toast-context";

import { useRevokeOtherSessionsMutation, useRevokeSessionMutation, useSessionsQuery } from "../api";
import { deviceLabel } from "../device-label";
import { ProfileSection } from "./ProfileSection";

export function SessionsSection() {
  const sessions = useSessionsQuery();
  const revoke = useRevokeSessionMutation();
  const revokeOthers = useRevokeOtherSessionsMutation();
  const [confirmOthers, setConfirmOthers] = useState(false);
  const toast = useToast();

  const items = sessions.data?.items ?? [];
  const otherCount = items.filter((session) => !session.is_current).length;

  function closeConfirm() {
    revokeOthers.reset();
    setConfirmOthers(false);
  }

  return (
    <ProfileSection title="Active sessions" description="Devices currently signed in to your FinCopilot account.">
      {sessions.isPending && <TableSkeleton rows={2} />}
      {sessions.isError && (
        <StateMessage
          icon={<AlertCircle size={20} />}
          title="Sessions couldn't be loaded"
          description="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void sessions.refetch()}
        />
      )}
      {revoke.isError && <Alert>{getErrorMessage(revoke.error)}</Alert>}

      {sessions.isSuccess && (
        <ul className="flex flex-col divide-y divide-line rounded-control border border-line" aria-label="Signed-in devices">
          {items.map((session) => {
            const label = deviceLabel(session.device_info);
            const isRevoking = revoke.isPending && revoke.variables.id === session.id;
            return (
              <li key={session.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Monitor size={18} className="text-secondary" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 text-[13px] font-semibold">
                    {label}
                    {session.is_current && <Badge tone="success">This device</Badge>}
                  </span>
                  <span className="text-xs text-secondary">
                    {[
                      session.ip_address,
                      `Signed in ${formatDateTime(session.created_at)}`,
                      session.last_used_at ? `Last active ${formatDateTime(session.last_used_at)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <Button
                  variant="secondary"
                  aria-label={`Sign out ${label}${session.is_current ? " (this device)" : ""}`}
                  loading={isRevoking}
                  onClick={() => {
                    revoke.mutate(
                      { id: session.id, isCurrent: session.is_current },
                      { onSuccess: () => { if (!session.is_current) toast("Device signed out"); } },
                    );
                  }}
                >
                  Sign out
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {sessions.isSuccess && otherCount === 0 && (
        <p className="text-[13px] text-secondary">You're only signed in on this device.</p>
      )}
      {otherCount > 0 && (
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmOthers(true);
            }}
          >
            Sign out all other devices
          </Button>
        </div>
      )}

      <Dialog open={confirmOthers} title="Sign out other devices?" onClose={closeConfirm}>
        {revokeOthers.isError && <Alert>{getErrorMessage(revokeOthers.error)}</Alert>}
        <p className="text-[13px] text-slate-600">
          Every device except this one will be signed out and will need to log in again.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={closeConfirm}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={revokeOthers.isPending}
            onClick={() => {
              revokeOthers.mutate(undefined, {
                onSuccess: ({ revoked }) => {
                  toast("Other devices signed out", `${revoked} ${revoked === 1 ? "device was" : "devices were"} signed out.`);
                  closeConfirm();
                },
              });
            }}
          >
            Sign out devices
          </Button>
        </div>
      </Dialog>
    </ProfileSection>
  );
}
