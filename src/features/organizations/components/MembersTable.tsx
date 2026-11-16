import { Badge } from "@/shared/ui/Badge";
import { Avatar } from "@/shared/ui/Avatar";

import type { OrgInvite, OrgMember } from "../api";

const ROLE_LABEL: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Member" };

interface MembersTableProps {
  members: OrgMember[];
  invites: OrgInvite[];
  myUserId: string | undefined;
  /** Admin view shows the actions column. */
  canManage: boolean;
  onRemove: (member: OrgMember) => void;
  /** Send a fresh invite to someone who declined. */
  onReinvite: (invite: OrgInvite) => void;
  /** Email currently being re-invited. */
  reinvitingEmail?: string;
}

const th = "h-10 px-4 text-left text-[11px] font-semibold tracking-wide text-secondary uppercase";
const td = "h-14 px-4 text-[13px] text-slate-600";

export function MembersTable({ members, invites, myUserId, canManage, onRemove, onReinvite, reinvitingEmail }: MembersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead className="border-b border-line bg-canvas">
          <tr>
            <th className={th}>Name</th>
            <th className={th}>Email</th>
            <th className={th}>Role</th>
            <th className={th}>Status</th>
            {canManage && (
              <th className={th}>
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const name = member.full_name ?? member.email ?? "Unknown";
            const removable = canManage && member.role !== "owner" && member.user_id !== myUserId;
            return (
              <tr key={member.user_id} className="border-b border-line last:border-b-0">
                <td className={td}>
                  <span className="flex items-center gap-2.5">
                    <Avatar name={name} size="sm" />
                    <strong className="font-semibold text-text">
                      {name}
                      {member.user_id === myUserId && <span className="ml-1 font-normal text-secondary">(you)</span>}
                    </strong>
                  </span>
                </td>
                <td className={td}>{member.email}</td>
                <td className={td}>
                  <Badge>{ROLE_LABEL[member.role] ?? member.role}</Badge>
                </td>
                <td className={td}>
                  <Badge tone="success">Active</Badge>
                </td>
                {canManage && (
                  <td className={`${td} text-right`}>
                    {removable && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-danger hover:underline"
                        onClick={() => {
                          onRemove(member);
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {invites.map((invite) => {
            const isDeclined = Boolean(invite.declined_at);
            return (
            <tr key={invite.id} className="border-b border-line last:border-b-0">
              <td className={td}>
                <span className="flex items-center gap-2.5">
                  <Avatar name={invite.email} size="sm" />
                  <span className="text-secondary">Invited</span>
                </span>
              </td>
              <td className={td}>{invite.email}</td>
              <td className={td}>
                <Badge>{ROLE_LABEL[invite.role] ?? invite.role}</Badge>
              </td>
              <td className={td}>
                {isDeclined ? <Badge tone="danger">Declined</Badge> : <Badge tone="warning">Pending</Badge>}
              </td>
              {canManage && (
                <td className={`${td} text-right`}>
                  {isDeclined ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
                      disabled={reinvitingEmail === invite.email}
                      onClick={() => {
                        onReinvite(invite);
                      }}
                    >
                      {reinvitingEmail === invite.email ? "Sending…" : "Invite again"}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400" title="Revoking invites is coming soon">
                      Revoke · Soon
                    </span>
                  )}
                </td>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
