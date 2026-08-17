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
 * Tăng mỗi khi có phiên mới (login / register / OAuth / logout). bootstrap()
 * là async nên có thể resolve SAU một phiên mới hơn — ví dụ ở /auth/callback,
 * bootstrap khôi phục phiên cũ trong khi setSession đã ghi phiên OAuth. So
 * epoch trước khi ghi kết quả để phiên cũ không đè phiên mới.
 */
let sessionEpoch = 0;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",

  /**
   * Chạy một lần lúc app mount. Access token chỉ nằm trong memory nên sau
   * mỗi lần reload nó rỗng — gọi /auth/me sẽ nhận 401, apiFetch tự refresh
   * rồi retry. Thiếu bước này, F5 là văng ra /login.
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
      if (epoch !== sessionEpoch) return; // đã có phiên mới hơn
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

  /** Dùng cho OAuth callback: đã có token, cần lấy user nếu chưa có. */
  async setSession(tokens, user) {
    sessionEpoch += 1;
    const epoch = sessionEpoch;
    tokenStore.setTokens(tokens);
    const resolved = user ?? (await authApi.me());
    if (epoch !== sessionEpoch) return;
    set({ user: resolved, status: "authenticated" });
  },

  /**
   * Thay bản user trong store sau khi cập nhật hồ sơ. Chỉ ghi khi đang
   * authenticated — tránh hồi sinh phiên vừa bị reset.
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
      // Mạng hỏng không được phép giữ người dùng ở trạng thái đăng nhập —
      // vẫn clear ở dưới.
    }
    get().reset();
  },

  reset() {
    sessionEpoch += 1;
    tokenStore.clear();
    set({ user: null, status: "unauthenticated" });
  },
}));

// Refresh thất bại ở tầng HTTP → hạ trạng thái xuống unauthenticated.
// AuthGuard sẽ lo phần điều hướng.
setSessionExpiredHandler(() => {
  useAuthStore.getState().reset();
});
