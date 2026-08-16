"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as friendsApi from "./api";
import { getPublicProfile } from "../users/api";
import { userKeys } from "../users/hooks";
import type { FriendRequestDirection } from "./types";

/** Query key factory — nguồn sự thật DUY NHẤT cho key của feature friends. */
export const friendKeys = {
  all: ["friends"] as const,
  list: () => [...friendKeys.all, "list"] as const,
  requests: () => [...friendKeys.all, "requests"] as const,
  request: (direction: FriendRequestDirection) =>
    [...friendKeys.requests(), direction] as const,
};

export function useFriends() {
  return useQuery({
    queryKey: friendKeys.list(),
    queryFn: ({ signal }) => friendsApi.listFriends(signal),
  });
}

/**
 * Lời mời đang chờ. Hai chiều là hai request riêng của backend nên cũng là hai
 * query riêng — nhét chung một key thì chiều này ghi đè chiều kia.
 */
export function useFriendRequests(
  direction: FriendRequestDirection = "incoming",
) {
  return useQuery({
    queryKey: friendKeys.request(direction),
    queryFn: ({ signal }) => friendsApi.listFriendRequests(direction, signal),
  });
}

/**
 * Tìm người theo username — khớp TUYỆT ĐỐI qua `GET /users/{username}`.
 *
 * Backend không có endpoint tìm mờ, và `PublicProfileDto` không kèm trạng thái
 * quan hệ; trạng thái đó suy ra từ danh sách bạn/lời mời ở component (xem
 * `findFriendState`). Chỉ chạy khi đã submit — gõ dở mà bắn request thì vừa tốn
 * vừa luôn 404.
 */
export function useFindUserByUsername(username: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(username ?? ""),
    queryFn: ({ signal }) => getPublicProfile(username!, signal),
    enabled: Boolean(username),
    retry: false,
  });
}

/**
 * Gửi lời mời. Nếu người kia đang mời mình, backend chấp nhận luôn và trả
 * `state = "friends"` — nên phải invalidate cả danh sách bạn, không chỉ lời mời.
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => friendsApi.sendFriendRequest(username),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: friendKeys.all }),
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => friendsApi.acceptFriendRequest(username),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: friendKeys.all }),
  });
}

/** Từ chối lời mời đến, hoặc huỷ lời mời đã gửi — cùng một endpoint. */
export function useRemoveFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => friendsApi.removeFriendRequest(username),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: friendKeys.all }),
  });
}

export function useUnfriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) => friendsApi.unfriend(username),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: friendKeys.all }),
  });
}
