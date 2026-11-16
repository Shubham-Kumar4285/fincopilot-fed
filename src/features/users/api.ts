/**
 * Users API: request functions → query keys → hooks.
 * Backend: backend/app/modules/users/api.py
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/shared/api/client";
import type { Schema } from "@/shared/api/types";

import type { ProfileInput } from "./schemas";

export type Me = Schema<"UserProfileResponse">;
export type MyInvite = Schema<"MyInviteResponse">;

const getMe = () => api.get<Me>("/users/me");
const getMyInvites = () => api.get<MyInvite[]>("/users/me/invites");

function updateMe(input: ProfileInput): Promise<Me> {
  const body: Schema<"UserUpdate"> = { full_name: input.fullName };
  return api.patch<Me>("/users/me", body);
}

export const userKeys = {
  me: ["users", "me"] as const,
  invites: ["users", "me", "invites"] as const,
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
