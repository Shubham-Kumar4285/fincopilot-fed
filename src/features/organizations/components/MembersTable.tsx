import { Badge } from "@/shared/ui/Badge";
import { Avatar } from "@/shared/ui/Avatar";

import type { OrgInvite, OrgMember } from "../api";

const ROLE_LABEL: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Member" };

type Role = OrgMember["role"];

/** Mirrors the backend: owner removes admins and members, admins remove members; nobody removes the owner or themselves. */
function canRemove(myRole: Role | undefined, member: OrgMember, myUserId: string | undefined): boolean {
  if (member.user_id === myUserId || member.role === "owner") return false;
  if (myRole === "owner") return true;
  return myRole === "admin" && member.role === "member";
}

interface MembersTableProps {
  members: OrgMember[];
  invites: OrgInvite[];
  myUserId: string | undefined;
  myRole: Role | undefined;
  /** Admin view shows the actions column. */
  canManage: boolean;
  onRemove: (member: OrgMember) => void;
  /** Owner only: switch someone between admin and member. */
  onChangeRole: (member: OrgMember, role: "admin" | "member") => void;
  /** Owner only: hand the workspace to this member. */
  onTransfer: (member: OrgMember) => void;
  /** user_id whose role is being saved. */
  changingRoleFor?: string;
  /** Send a fresh invite to someone who declined. */
  onReinvite: (invite: OrgInvite) => void;
  /** Email currently being re-invited. */
  reinvitingEmail?: string;
}

const th = "h-10 px-4 text-left text-[11px] font-semibold tracking-wide text-secondary uppercase";
const td = "h-14 px-4 text-[13px] text-slate-600";

export function MembersTable({
  members,
  invites,
  myUserId,
  myRole,
  canManage,
  onRemove,
  onChangeRole,
  onTransfer,
  changingRoleFor,
  onReinvite,
  reinvitingEmail,
}: MembersTableProps) {
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
            const removable = canManage && canRemove(myRole, member, myUserId);
            const isOwnerView = myRole === "owner" && member.role !== "owner";
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
                  {isOwnerView ? (
                    <select
                      aria-label={`Role for ${name}`}
                      className="h-8 rounded-control border border-line-strong bg-surface px-2 text-[13px] disabled:opacity-60"
                      value={member.role}
                      disabled={changingRoleFor === member.user_id}
                      onChange={(event) => {
                        onChangeRole(member, event.target.value === "admin" ? "admin" : "member");
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <Badge>{ROLE_LABEL[member.role] ?? member.role}</Badge>
                  )}
                </td>
                <td className={td}>
                  <Badge tone="success">Active</Badge>
                </td>
                {canManage && (
                  <td className={`${td} text-right`}>
                    <span className="inline-flex items-center gap-3">
                      {isOwnerView && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-accent-hover hover:underline"
                          aria-label={`Make ${name} the owner`}
                          onClick={() => {
                            onTransfer(member);
                          }}
                        >
                          Make owner
                        </button>
                      )}
                      {removable && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-danger hover:underline"
                          aria-label={`Remove ${name}`}
                          onClick={() => {
                            onRemove(member);
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </span>
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
