import { create } from "zustand";

import * as authApi from "./api";
import { setSessionExpiredHandler } from "../client";
import { tokenStore } from "./token-store";
import type { LoginInput, RegisterInput } from "./schemas";
import type { AuthTokens, User } from "./types";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

type AuthState = {
  user: User | null;
  status: AuthStatus;

  bootstrap: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (tokens: AuthTokens, user?: User) => Promise<void>;
  setUser: (user: User) => void;
  reset: () => void;
};

/**
 * Incremented on every new session (login / register / OAuth / logout).
 * bootstrap() is async and can therefore resolve AFTER a newer session — at
 * /auth/callback, for instance, bootstrap restores the old session while
 * setSession has already written the OAuth one. The epoch is compared before
 * writing the result so an old session cannot overwrite a newer one.
 */
let sessionEpoch = 0;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",

  /**
   * Runs once when the app mounts. The access token lives in memory only, so
   * after every reload it is empty — /auth/me answers 401, apiFetch refreshes
   * and retries. Without this step, F5 throws the user out to /login.
   */
  async bootstrap() {
    if (get().status !== "idle") return;

    if (!tokenStore.getRefresh()) {
      set({ status: "unauthenticated", user: null });
      return;
    }
    const epoch = sessionEpoch;
    set({ status: "loading" });
    try {
      const user = await authApi.me();
      if (epoch !== sessionEpoch) return; // a newer session already exists
      set({ user, status: "authenticated" });
    } catch {
      if (epoch !== sessionEpoch) return;
      tokenStore.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },

  async login(input) {
    const { user, ...tokens } = await authApi.login(input);
    sessionEpoch += 1;
    tokenStore.setTokens(tokens);
    set({ user, status: "authenticated" });
  },

  async register(input) {
    const { user, ...tokens } = await authApi.register(input);
    sessionEpoch += 1;
    tokenStore.setTokens(tokens);
    set({ user, status: "authenticated" });
  },

  /** For the OAuth callback: tokens are in hand, fetch the user if we lack one. */
  async setSession(tokens, user) {
    sessionEpoch += 1;
    const epoch = sessionEpoch;
    tokenStore.setTokens(tokens);
    const resolved = user ?? (await authApi.me());
    if (epoch !== sessionEpoch) return;
    set({ user: resolved, status: "authenticated" });
  },

  /**
   * Replace the stored user after a profile update. Only writes while
   * authenticated — so it cannot resurrect a session that was just reset.
   */
  setUser(user) {
    if (get().status !== "authenticated") return;
    set({ user });
  },

  async logout() {
    const refreshToken = tokenStore.getRefresh();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // A network failure must not leave the user stuck signed in — the clear
      // below runs regardless.
    }
    get().reset();
  },

  reset() {
    sessionEpoch += 1;
    tokenStore.clear();
    set({ user: null, status: "unauthenticated" });
  },
}));

// A refresh failure at the HTTP layer → drop the status to unauthenticated.
// AuthGuard takes care of the navigation.
setSessionExpiredHandler(() => {
  useAuthStore.getState().reset();
});
