"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as usersApi from "./api";
import { authKeys } from "../auth/hooks";
import { useAuthStore } from "../auth/store";
import type { ChangeLanguageInput, ChangeUsernameInput } from "./schemas";

/** Query key factory — nguồn sự thật DUY NHẤT cho key của feature users. */
export const userKeys = {
  all: ["users"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (username: string) => [...userKeys.details(), username] as const,
};

/** Hồ sơ công khai của một người, tra theo username. */
export function usePublicProfile(username: string | null | undefined) {
  return useQuery({
    queryKey: userKeys.detail(username ?? ""),
    queryFn: ({ signal }) => usersApi.getPublicProfile(username!, signal),
    enabled: Boolean(username),
    // Hồ sơ đổi rất thưa; presence realtime đi đường socket riêng.
    staleTime: 5 * 60_000,
  });
}

/**
 * Đổi username của chính mình.
 *
 * Response cùng shape `/auth/me` nên ghi thẳng vào cache `authKeys.me()` và
 * auth store — không cần refetch, và mọi chỗ đọc `user` cập nhật cùng nhịp.
 */
export function useChangeUsername() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: ChangeUsernameInput) => usersApi.changeUsername(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user);
      setUser(user);
      // Hồ sơ công khai nằm dưới key username CŨ → bỏ hết cho fetch lại.
      queryClient.removeQueries({ queryKey: userKeys.details() });
    },
  });
}

/**
 * Đổi ngôn ngữ giao diện của chính mình.
 *
 * Chỉ ghi phía server — cookie và điều hướng do `LanguageSwitcher` lo TRƯỚC khi
 * gọi hook này (§4.2): giao diện phải đổi ngay khi bấm, không đợi mạng. Vì vậy
 * mutation này hỏng cũng không rollback gì: người dùng vẫn đang đọc đúng ngôn
 * ngữ họ chọn, chỉ là lần đăng nhập ở máy khác chưa nhớ được.
 *
 * `onSuccess` ghi lại user vào cache + auth store, giống `useChangeUsername` —
 * nếu không, `user.language` trong bộ nhớ vẫn là giá trị cũ và lần
 * `bootstrap()` kế tiếp sẽ kéo giao diện về ngôn ngữ trước đó.
 */
export function useChangeLanguage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: ChangeLanguageInput) => usersApi.changeLanguage(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user);
      setUser(user);
    },
  });
}
