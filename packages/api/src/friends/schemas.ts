import { z } from "zod";

import { publicProfileSchema } from "../users/schemas";

/**
 * The form schema. Its constraints MATCH `ChangeUsernameDto` (3–32 characters,
 * lowercase letters/digits/`_`/`-`) because both describe the same identifier —
 * drift means failing to find people whose username is perfectly valid.
 */
export const findFriendSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "validation.username.tooShort")
    .max(32, "validation.username.tooLong")
    .regex(
      /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/,
      "validation.username.pattern",
    )
    .transform((v) => v.toLowerCase()),
});

export type FindFriendInput = z.infer<typeof findFriendSchema>;

/* ---- Response schemas (mirror DTO) ---- */

/** `FriendDto` */
export const friendSchema = z.object({
  user: publicProfileSchema,
  state: z.enum(["none", "pending_outgoing", "pending_incoming", "friends"]),
  since: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
});

/** `FriendListDto` */
export const friendListSchema = z.object({
  items: z.array(friendSchema),
  total: z.number(),
});
