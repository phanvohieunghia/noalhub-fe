"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as friendsApi from "./api";
import { getPublicProfile } from "../users/api";
import { userKeys } from "../users/hooks";
import type { FriendRequestDirection } from "./types";

/** Query key factory — the ONLY source of truth for the friends feature's keys. */
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
 * Pending requests. The two directions are separate backend requests and are
 * therefore separate queries — sharing one key would let each direction
 * overwrite the other.
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
 * Find someone by username — an EXACT match through `GET /users/{username}`.
 *
 * The backend has no fuzzy-search endpoint, and `PublicProfileDto` carries no
 * relationship state; that state is derived from the friend/request lists in
 * the component (see `findFriendState`). It only runs after submit — firing on
 * every keystroke is both wasteful and always a 404.
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
 * Send a request. If the other person already invited you, the backend accepts
 * immediately and returns `state = "friends"` — so the friend list must be
 * invalidated too, not just the requests.
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

/** Decline an incoming request, or cancel one you sent — the same endpoint. */
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
