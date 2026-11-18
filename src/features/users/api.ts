/**
 * Users API: request functions → query keys → hooks.
 * Backend: backend/app/modules/users/api.py
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, endSession } from "@/shared/api/client";
import type { Schema } from "@/shared/api/types";

import type { AccountDeleteInput, PasswordChangeInput, ProfileInput } from "./schemas";

export type Me = Schema<"UserProfileResponse">;
export type MyInvite = Schema<"MyInviteResponse">;
export type UserSession = Schema<"SessionResponse">;
export type CodeSent = Schema<"PasswordChangeCodeResponse">;

const getMe = () => api.get<Me>("/users/me");
const getMyInvites = () => api.get<MyInvite[]>("/users/me/invites");

function updateMe(input: ProfileInput): Promise<Me> {
  const body: Schema<"UserUpdate"> = { full_name: input.fullName };
  return api.patch<Me>("/users/me", body);
}

const requestPasswordCode = () => api.post<CodeSent>("/users/me/password/otp");

function changePassword(input: PasswordChangeInput): Promise<Schema<"PasswordChangeResponse">> {
  const body: Schema<"PasswordChangeRequest"> = {
    otp: input.otp,
    new_password: input.newPassword,
    current_password: input.currentPassword || null,
  };
  return api.post<Schema<"PasswordChangeResponse">>("/users/me/password", body);
}

const getSessions = () => api.get<Schema<"SessionListResponse">>("/users/me/sessions");
const revokeSession = (sessionId: string) => api.delete(`/users/me/sessions/${encodeURIComponent(sessionId)}`);
const revokeOtherSessions = () => api.post<Schema<"RevokeSessionsResponse">>("/users/me/sessions/revoke-others");

/** 409 `details.orgs` when the user still owns workspaces with other members. */
const requestDeleteCode = () => api.post<Schema<"AccountDeleteCodeResponse">>("/users/me/delete/otp");

function deleteAccount(input: AccountDeleteInput): Promise<void> {
  const body: Schema<"AccountDeleteRequest"> = { otp: input.otp, current_password: input.currentPassword || null };
  return api.delete("/users/me", body);
}

export const userKeys = {
  me: ["users", "me"] as const,
  invites: ["users", "me", "invites"] as const,
  sessions: ["users", "me", "sessions"] as const,
};

export function useMeQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: userKeys.me, queryFn: getMe, enabled });
}

/** Pending invites addressed to the signed-in user (accepted, declined and expired ones are excluded). */
export function useMyInvitesQuery() {
  return useQuery({ queryKey: userKeys.invites, queryFn: getMyInvites });
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    onSuccess: (me) => {
      queryClient.setQueryData(userKeys.me, me);
    },
  });
}

export function useRequestPasswordCodeMutation() {
  return useMutation({ mutationFn: requestPasswordCode });
}

/** Other devices are signed out by the backend, so the session list changes too. */
export function useChangePasswordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userKeys.sessions }),
  });
}

export function useSessionsQuery() {
  return useQuery({ queryKey: userKeys.sessions, queryFn: getSessions });
}

/** Revoking this device's own session ends it here too. */
export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; isCurrent: boolean }) => revokeSession(id),
    onSuccess: (_data, { isCurrent }) => {
      if (isCurrent) endSession("signed_out");
      else void queryClient.invalidateQueries({ queryKey: userKeys.sessions });
    },
  });
}

export function useRevokeOtherSessionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: userKeys.sessions }),
  });
}

export function useRequestDeleteCodeMutation() {
  return useMutation({ mutationFn: requestDeleteCode });
}

/** The backend revokes every session; end this one and show the login page with an explanation. */
export function useDeleteAccountMutation() {
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      endSession("account_deleted");
    },
  });
}
