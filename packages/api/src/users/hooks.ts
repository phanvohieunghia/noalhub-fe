"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as usersApi from "./api";
import { authKeys } from "../auth/hooks";
import { useAuthStore } from "../auth/store";
import type { ChangeLanguageInput, ChangeUsernameInput } from "./schemas";

/** Query key factory — the ONLY source of truth for the users feature's keys. */
export const userKeys = {
  all: ["users"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (username: string) => [...userKeys.details(), username] as const,
};

/** Someone's public profile, looked up by username. */
export function usePublicProfile(username: string | null | undefined) {
  return useQuery({
    queryKey: userKeys.detail(username ?? ""),
    queryFn: ({ signal }) => usersApi.getPublicProfile(username!, signal),
    enabled: Boolean(username),
    // Profiles change rarely; realtime presence has its own socket channel.
    staleTime: 5 * 60_000,
  });
}

/**
 * Change your own username.
 *
 * The response has the same shape as `/auth/me`, so it is written straight into
 * the `authKeys.me()` cache and the auth store — no refetch needed, and every
 * reader of `user` updates in the same beat.
 */
export function useChangeUsername() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: ChangeUsernameInput) => usersApi.changeUsername(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user);
      setUser(user);
      // Public profiles are cached under the OLD username key → drop them to refetch.
      queryClient.removeQueries({ queryKey: userKeys.details() });
    },
  });
}

/**
 * Change your own interface language.
 *
 * This writes the server side only — the cookie and the navigation are
 * `LanguageSwitcher`'s job, done BEFORE this hook is called (§4.2): the UI has
 * to change the instant the button is pressed, not when the network answers.
 * That is why a failed mutation rolls nothing back: the user is still reading
 * in the language they chose, it simply will not be remembered on another
 * machine.
 *
 * `onSuccess` writes the user back into the cache and the auth store, like
 * `useChangeUsername` — without it, the in-memory `user.language` stays stale
 * and the next `bootstrap()` drags the UI back to the previous language.
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
