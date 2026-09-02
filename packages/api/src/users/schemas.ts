import { z } from "zod";

/**
 * The form schema — its constraints must MATCH `ChangeUsernameDto` (min 3, max
 * 32, lowercase letters/digits/`_`/`-`, starting and ending alphanumeric).
 * The backend lowercases input itself, so the client only warns about unusual
 * characters and never blocks uppercase.
 */
export const changeUsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "validation.username.tooShort")
    .max(32, "validation.username.tooLong")
    .regex(
      /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/,
      "validation.username.patternStrict",
    )
    // The backend lowercases — do it on the client too so what is shown matches what is stored.
    .transform((v) => v.toLowerCase()),
});

export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;

/** Matches `ChangeLanguageDto` — an enum, with no other constraints. */
export const changeLanguageSchema = z.object({
  language: z.enum(["vi", "en"]),
});

export type ChangeLanguageInput = z.infer<typeof changeLanguageSchema>;

/** `UserDto` — reusing auth's schema, since it is the same DTO. */
export { userSchema } from "../auth/schemas";

/** `PublicProfileDto` — someone else's profile, with fewer fields than `userSchema`. */
export const publicProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  avatarUrl: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  createdAt: z.string(),
  lastSeenAt: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
});
