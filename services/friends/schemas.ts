import { z } from "zod";

import { publicProfileSchema } from "../users/schemas";

/**
 * Form schema. Ràng buộc giữ KHỚP `ChangeUsernameDto` (3–32 ký tự, chữ
 * thường/số/`_`/`-`) vì cùng nói về một định danh — lệch là tìm hụt người có
 * username hợp lệ.
 */
export const findFriendSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username tối thiểu 3 ký tự")
    .max(32, "Username tối đa 32 ký tự")
    .regex(
      /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/,
      "Chỉ dùng chữ, số, `_` và `-`",
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
