import type { User, UserRole } from "./types";

/**
 * "Does this session satisfy the role a screen asks for?"
 *
 * The rule is **at least**, not **equal to** — the backend's `ROLE_SATISFIES`
 * (`src/users/role.policy.ts`) says `super_admin` satisfies `admin`. Comparing
 * the strings instead (`me.role !== "admin"`) denies the most privileged
 * account in the system, which is how this was found.
 *
 * It reads the backend's derived flags rather than re-implementing the role
 * table, so adding a fourth role changes the backend only. The one exception is
 * `super_admin`, for which no flag is shipped — `canGenerateAi` happens to mean
 * the same thing today, but it answers "may spend money", not "is a super
 * admin", and leaning on that coincidence would break silently the day AI
 * access is granted to anyone else.
 *
 * This is **UX, not security**: the body comes from the client and anyone can
 * edit it in devtools. The real boundary stays the backend's 403.
 */
export function satisfiesRole(
  user: Pick<User, "role" | "isAdmin" | "canGenerateAi">,
  required: UserRole,
): boolean {
  switch (required) {
    case "user":
      return true;
    case "admin":
      return user.isAdmin;
    case "super_admin":
      return user.role === "super_admin";
  }
}
