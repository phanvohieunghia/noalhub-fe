"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as authApi from "./api";
import { tokenStore } from "@/lib/auth/token-store";
import { useAuthStore } from "@/lib/auth/store";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./schemas";

/**
 * Query key factory — nguồn sự thật DUY NHẤT cho key của feature auth.
 */
export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

/**
 * Thông tin user hiện tại.
 *
 * Chỉ chạy khi CÓ refresh token: access token nằm trong memory nên sau reload
 * nó rỗng, `services/client.ts` sẽ tự refresh rồi retry. Không có refresh token
 * thì gọi chỉ tổ nhận 401.
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
    // Cache là dữ liệu của MỘT user — không xoá thì user kế tiếp đăng nhập
    // trên cùng tab sẽ thấy dữ liệu cũ trong một nhịp.
    onSettled: () => queryClient.clear(),
  });
}

/** Đăng xuất mọi thiết bị. Vô hiệu cả access token đang lưu hành. */
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
 * Đổi mật khẩu khi đang đăng nhập. Backend giết mọi phiên cũ và trả về phiên
 * mới — phải ghi đè token ngay, nếu không request kế tiếp sẽ 401.
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
    // emailVerified vừa đổi → user trong cache đã cũ.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export function useResendVerifyEmail() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerifyEmail(email),
  });
}

/** Bước cuối luồng OAuth: đổi handoff code lấy session. */
/**
 * URL bắt đầu OAuth. Không phải hook (chỉ là điều hướng top-level, không có
 * request nào để cache) nhưng vẫn re-export ở đây để component không phải
 * import `service.ts` — xem `docs/data-layer.md` §1.
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
