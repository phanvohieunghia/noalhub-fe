import { z } from "zod";

/**
 * Form schema — ràng buộc phải KHỚP `ChangeUsernameDto` (min 3, max 32,
 * chữ thường/số/`_`/`-`, bắt đầu và kết thúc bằng chữ hoặc số).
 * Backend tự hạ chữ hoa nên client cũng chỉ cảnh báo ký tự lạ, không chặn hoa.
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
    // Backend hạ chữ hoa — hạ luôn ở client để giá trị hiển thị khớp bản lưu.
    .transform((v) => v.toLowerCase()),
});

export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;

/** Khớp `ChangeLanguageDto` — enum, không có ràng buộc nào khác. */
export const changeLanguageSchema = z.object({
  language: z.enum(["vi", "en"]),
});

export type ChangeLanguageInput = z.infer<typeof changeLanguageSchema>;

/** `UserDto` — dùng lại schema của auth, cùng một DTO. */
export { userSchema } from "../auth/schemas";

/** `PublicProfileDto` — hồ sơ người khác, ít trường hơn `userSchema`. */
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
