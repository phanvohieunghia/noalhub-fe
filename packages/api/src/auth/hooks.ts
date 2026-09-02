"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as authApi from "./api";
import { tokenStore } from "./token-store";
import { useAuthStore } from "./store";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./schemas";

/**
 * Query key factory — the ONLY source of truth for the auth feature's keys.
 */
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

/**
 * The current user.
 *
 * Runs only when a refresh token EXISTS: the access token lives in memory, so
 * after a reload it is empty and `services/client.ts` refreshes then retries.
 * With no refresh token, calling this only earns a 401.
 */
export function useMe() {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: status === "authenticated" || Boolean(tokenStore.getRefresh()),
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.all }),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const registerUser = useAuthStore((s) => s.register);

  return useMutation({
    mutationFn: (input: RegisterInput) => registerUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.all }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => logout(),
    // The cache holds ONE user's data — without clearing it, the next user to
    // sign in on this tab sees the previous one's data for a beat.
    onSettled: () => queryClient.clear(),
  });
}

/** Sign out on every device. Invalidates outstanding access tokens too. */
export function useLogoutAll() {
  const queryClient = useQueryClient();
  const reset = useAuthStore((s) => s.reset);

  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSettled: () => {
      reset();
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      authApi.forgotPassword(input),
  });
}

export function useResetPassword(token: string) {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) =>
      authApi.resetPassword(token, input),
  });
}

/**
 * Change the password while signed in. The backend kills every old session and
 * returns a new one — the tokens must be overwritten immediately, or the next
 * request is a 401.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      authApi.changePassword(input),
    onSuccess: async ({ user, ...tokens }) => {
      await setSession(tokens, user);
      queryClient.setQueryData(authKeys.me(), user);
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    // emailVerified just changed → the cached user is stale.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export function useResendVerifyEmail() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerifyEmail(email),
  });
}

/** The final OAuth step: exchange the handoff code for a session. */
/**
 * The OAuth start URL. Not a hook (it is just a top-level navigation with no
 * request to cache), but re-exported here so components never have to import
 * `service.ts` — see `docs/data-layer.md` §1.
 */
export const oauthStartUrl = authApi.oauthStartUrl;

export function useOAuthExchange() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (code: string) => authApi.oauthExchange(code),
    onSuccess: async ({ user, ...tokens }) => {
      await setSession(tokens, user);
      queryClient.setQueryData(authKeys.me(), user);
    },
  });
}
