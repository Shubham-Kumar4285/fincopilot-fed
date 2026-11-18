/**
 * Organizations API: request functions → query keys → hooks.
 * Backend: backend/app/modules/organizations/api.py ("current" = the org sent as X-Org-Id, else the primary org).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useMeQuery, userKeys } from "@/features/users";
import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { Schema } from "@/shared/api/types";
import { PATHS } from "@/shared/config/paths";

import { clearActiveOrg, setActiveOrg } from "./active-org";
import type { InviteInput, WorkspaceInput } from "./schemas";

export type Organization = Schema<"OrganizationResponse">;
export type OrgMember = Schema<"OrgMemberResponse">;
export type OrgInvite = Schema<"OrgInviteResponse">;
export type InvitePreview = Schema<"OrgInvitePreviewResponse">;
export type MyOrganization = Schema<"OrganizationWithRoleResponse">;

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

const toOrgBody = (input: WorkspaceInput) => ({
  name: input.name,
  country: input.country,
  base_currency: input.baseCurrency,
});

const getMyOrgs = () => api.get<MyOrganization[]>("/orgs");
const getCurrentOrg = () => api.get<Organization>("/orgs/current");
const createOrg = (input: WorkspaceInput) =>
  api.post<Organization>("/orgs", toOrgBody(input) satisfies Schema<"OrganizationCreate">);
const updateOrg = (input: WorkspaceInput) =>
  api.patch<Organization>("/orgs/current", toOrgBody(input) satisfies Schema<"OrganizationUpdate">);

const getMembers = () => api.get<Schema<"OrgMemberListResponse">>("/orgs/current/members");
const getPendingInvites = () => api.get<OrgInvite[]>("/orgs/current/invites");
const createInvite = (input: InviteInput) =>
  api.post<OrgInvite>("/orgs/current/invites", input satisfies Schema<"OrgInviteCreate">);
const removeMember = (userId: string) => api.delete(`/orgs/current/members/${encodeURIComponent(userId)}`);
const updateMemberRole = ({ userId, role }: { userId: string; role: Schema<"OrgMemberUpdateRole">["role"] }) =>
  api.patch<OrgMember>(
    `/orgs/current/members/${encodeURIComponent(userId)}`,
    { role } satisfies Schema<"OrgMemberUpdateRole">,
  );
const transferOwnership = (userId: string) =>
  api.post<Schema<"OwnershipTransferResponse">>(
    "/orgs/current/transfer-ownership",
    { user_id: userId } satisfies Schema<"OwnershipTransferRequest">,
  );
const leaveOrg = () => api.post("/orgs/current/leave");
const deleteOrg = (confirmName: string) =>
  api.delete("/orgs/current", { confirm_name: confirmName } satisfies Schema<"OrganizationDeleteRequest">);
const restoreOrg = (orgId: string) => api.post<Organization>(`/orgs/${encodeURIComponent(orgId)}/restore`);

const getInvitePreview = (token: string) =>
  api.get<InvitePreview>(`/orgs/invites/${encodeURIComponent(token)}`, { skipRefresh: true });
const acceptInvite = (token: string) =>
  api.post<Schema<"OrgInviteAcceptResponse">>(`/orgs/invites/${encodeURIComponent(token)}/accept`);

const acceptMyInvite = (inviteId: string) =>
  api.post<Schema<"OrgInviteAcceptResponse">>(`/users/me/invites/${encodeURIComponent(inviteId)}/accept`);
const declineMyInvite = (inviteId: string) => api.post(`/users/me/invites/${encodeURIComponent(inviteId)}/decline`);

// ---------------------------------------------------------------------------
// Keys & hooks
// ---------------------------------------------------------------------------

export const orgKeys = {
  all: ["orgs"] as const,
  list: ["orgs", "list"] as const,
  current: ["orgs", "current"] as const,
  members: ["orgs", "current", "members"] as const,
  invites: ["orgs", "current", "invites"] as const,
  invitePreview: (token: string) => ["orgs", "invite-preview", token] as const,
};

export function useOrgsQuery() {
  return useQuery({ queryKey: orgKeys.list, queryFn: getMyOrgs });
}

/** Queries that belong to the person, not to a workspace, survive an org switch. */
const USER_SCOPED_ROOTS = new Set<unknown>(["auth", "users"]);
const isWorkspaceQuery = ({ queryKey }: { queryKey: readonly unknown[] }) => !USER_SCOPED_ROOTS.has(queryKey[0]);

/** Make `orgId` the active workspace: reset every workspace query (any feature) and open `to` (its dashboard). */
export function useSwitchOrg() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(
    (orgId: string, to: string = PATHS.dashboard) => {
      setActiveOrg(orgId);
      void queryClient.resetQueries({ predicate: isWorkspaceQuery });
      void navigate(to, { replace: true });
    },
    [queryClient, navigate],
  );
}

/**
 * After leaving or deleting the current workspace: forget it, drop its data and go to the dashboard,
 * where RequireOrg falls back to the next workspace (or onboarding when there is none).
 */
function useExitWorkspace() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(() => {
    clearActiveOrg();
    void queryClient.resetQueries({ predicate: isWorkspaceQuery });
    void navigate(PATHS.dashboard, { replace: true });
  }, [queryClient, navigate]);
}

export function useCurrentOrgQuery() {
  return useQuery({ queryKey: orgKeys.current, queryFn: getCurrentOrg });
}

export function useMembersQuery() {
  return useQuery({ queryKey: orgKeys.members, queryFn: getMembers });
}

/** Admin-only on the backend (members get 403), so callers pass `enabled: isAdmin`. */
export function usePendingInvitesQuery({ enabled }: { enabled: boolean }) {
  return useQuery({ queryKey: orgKeys.invites, queryFn: getPendingInvites, enabled });
}

export function useInvitePreviewQuery(token: string) {
  return useQuery({ queryKey: orgKeys.invitePreview(token), queryFn: () => getInvitePreview(token), retry: false });
}

/** The signed-in user's role in the current org, derived from the member list. */
export function useMyRole() {
  const me = useMeQuery();
  const members = useMembersQuery();
  const role = members.data?.members.find((member) => member.user_id === me.data?.id)?.role;
  return {
    role,
    isAdmin: role === "owner" || role === "admin",
    isPending: me.isPending || members.isPending,
  };
}

export function useCreateOrgMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrg,
    onSuccess: (org) => {
      setActiveOrg(org.id);
      void queryClient.resetQueries({ predicate: isWorkspaceQuery });
    },
  });
}

export function useUpdateOrgMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOrg,
    onSuccess: (org) => {
      queryClient.setQueryData<Organization>(orgKeys.current, (old) => ({ ...org, member_count: old?.member_count }));
    },
  });
}

export function useCreateInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: orgKeys.invites }),
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgKeys.members });
      void queryClient.invalidateQueries({ queryKey: orgKeys.current });
    },
  });
}

/** Accept from the email link (token). Callers switch into the joined org on success. */
export function useAcceptInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userKeys.invites }),
  });
}

/** Accept an invite listed in the app (by id). Callers switch into the joined org on success. */
export function useAcceptMyInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptMyInvite,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userKeys.invites }),
  });
}

export function useDeclineMyInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: declineMyInvite,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userKeys.invites }),
  });
}

/** Owner only. Admin <-> member; ownership moves through `useTransferOwnershipMutation`. */
export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMemberRole,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: orgKeys.members }),
  });
}

/** The caller becomes an admin, so their role in the workspace list changes too. */
export function useTransferOwnershipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transferOwnership,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orgKeys.members });
      void queryClient.invalidateQueries({ queryKey: orgKeys.current });
      void queryClient.invalidateQueries({ queryKey: orgKeys.list });
    },
  });
}

export function useLeaveOrgMutation() {
  const exitWorkspace = useExitWorkspace();
  return useMutation({ mutationFn: leaveOrg, onSuccess: exitWorkspace });
}

/** Owner only; `confirmName` must equal the workspace name. Restorable for 30 days. */
export function useDeleteOrgMutation() {
  const exitWorkspace = useExitWorkspace();
  return useMutation({ mutationFn: deleteOrg, onSuccess: exitWorkspace });
}

/** Owner cancels a pending deletion, then works in that workspace again. */
export function useRestoreOrgMutation() {
  const switchOrg = useSwitchOrg();
  return useMutation({
    mutationFn: restoreOrg,
    // Switching resets every workspace query, the workspace list included.
    onSuccess: (org) => {
      switchOrg(org.id);
    },
  });
}

/** The requested workspace was deleted by its owner. Branches on status + `details.code`, never on the message. */
export function isOrgPendingDeletion(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403 && error.details.code === "org_pending_deletion";
}
