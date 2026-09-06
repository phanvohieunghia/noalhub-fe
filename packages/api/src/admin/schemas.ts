import { z } from "zod";

/**
 * Response schemas for the admin feature — REST bodies are parsed so a backend
 * shape change is caught right here instead of drifting into the table.
 *
 * Every nullable field uses `.nullish().transform(...)` rather than
 * `.nullable()`: the spec types them incorrectly (see `./types.ts`), so a field
 * may be absent entirely instead of `null`. Same treatment as
 * `chat/schemas.ts`.
 */

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  role: z.enum(["user", "admin"]),
  displayName: nullableString,
  avatarUrl: nullableString,
  emailVerifiedAt: nullableString,
  lastSeenAt: nullableString,
  usernameChangedAt: nullableString,
  createdAt: z.string(),
});

/**
 * `page`/`limit` use `.catch()` instead of being required: if the backend only
 * returns `items` + `total`, pagination can still be built from the query we
 * sent — not worth breaking the whole table over two echoed numbers.
 */
export const adminUserListSchema = z.object({
  items: z.array(adminUserSchema),
  total: z.number(),
  page: z.number().catch(1),
  limit: z.number().catch(20),
});

export const adminStatsSchema = z.object({
  totalUsers: z.number(),
  verifiedUsers: z.number(),
  newUsersLast7Days: z.number(),
  admins: z.number(),
});

/**
 * The input schema for the user table's filters. It parses **URL searchParams**
 * (the source of truth for filters, so links stay shareable) — hence every
 * field is optional and `page`/`limit` must be coerced: searchParams are always
 * strings.
 *
 * `limit` maxes at 100 to match the backend DTO; drift means the backend
 * answers `VALIDATION_FAILED` after the UI already accepted the input.
 */
export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  q: z.string().trim().min(1).optional().catch(undefined),
  role: z.enum(["user", "admin"]).optional().catch(undefined),
});

export type AdminUserListQueryInput = z.infer<typeof adminUserListQuerySchema>;

export const storybookAccessSchema = z.object({
  id: z.string(),
  email: z.string(),
  note: nullableString,
  createdBy: nullableString,
  createdAt: z.string(),
});

/**
 * The grant form.
 *
 * The email is lowercased here, not just trimmed, and that is load-bearing
 * rather than tidiness: the backend matches this string against the address
 * Google reports at sign-in, which is always lowercase. `Designer@Example.com`
 * stored verbatim would look right in the table and still lock the person out.
 */
export const storybookAccessFormSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "validation.email.invalid")
    .max(320, "validation.email.tooLong")
    .pipe(z.email("validation.email.invalid")),
  note: z.string().trim().max(255),
});

export type StorybookAccessFormValues = z.infer<typeof storybookAccessFormSchema>;
