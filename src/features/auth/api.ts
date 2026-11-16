/**
 * Auth API: request functions → query keys → hooks.
 * Backend: backend/app/modules/auth/api.py
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, refreshSession } from "@/shared/api/client";
import { tokenStore } from "@/shared/api/token-store";
import type { Schema } from "@/shared/api/types";

import { tokenResponseSchema } from "./schemas";
import type { ForgotPasswordInput, LoginInput, SignupInput } from "./schemas";

const AUTH_OPTS = { skipAuth: true, skipRefresh: true } as const;

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

async function login(input: LoginInput): Promise<Schema<"LoginResponse">> {
  const body: Schema<"LoginRequest"> = { email: input.email, password: input.password };
  const raw = await api.post<Schema<"LoginResponse">>("/auth/login", body, AUTH_OPTS);
  tokenStore.set(tokenResponseSchema.parse(raw).access_token);
  return raw;
}

async function signup(input: SignupInput): Promise<Schema<"SignupResponse">> {
  const body: Schema<"SignupRequest"> = { email: input.email, password: input.password, full_name: input.fullName };
  const raw = await api.post<Schema<"SignupResponse">>("/auth/signup", body, AUTH_OPTS);
  tokenStore.set(tokenResponseSchema.parse(raw).access_token);
  return raw;
}

async function logout(): Promise<void> {
  try {
    await api.post<Schema<"LogoutResponse">>("/auth/logout", undefined, { skipRefresh: true });
  } finally {
    tokenStore.clear();
  }
}

async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const body: Schema<"PasswordForgotRequest"> = { email: input.email };
  await api.post<Schema<"PasswordForgotResponse">>("/auth/password/forgot", body, AUTH_OPTS);
}

/** True when a session exists: an in-memory token, or one restored from the refresh cookie. */
async function restoreSession(): Promise<boolean> {
  return tokenStore.get() !== null || refreshSession();
}

// ---------------------------------------------------------------------------
// Keys & hooks
// ---------------------------------------------------------------------------

export const authKeys = {
  session: ["auth", "session"] as const,
};

export function useSessionQuery() {
  return useQuery({ queryKey: authKeys.session, queryFn: restoreSession, staleTime: Infinity, retry: false });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.session, true);
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signup,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.session, true);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: forgotPassword });
}
