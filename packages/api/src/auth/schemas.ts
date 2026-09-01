import { z } from "zod";

/**
 * Hai nhóm schema:
 * - Form schema: validate input phía client (UX). Ràng buộc phải KHỚP với DTO
 *   trong OpenAPI spec, nếu không backend sẽ trả VALIDATION_FAILED sau khi
 *   form đã báo hợp lệ.
 * - Response schema: parse body backend, bắt lỗi đổi shape ngay tại chỗ.
 */

const email = z.email("validation.email.invalid").max(320, "validation.email.tooLong");

/** Backend: minLength 12, maxLength 128, không ép ký tự đặc biệt. */
const password = z
  .string()
  .min(12, "validation.password.tooShort")
  .max(128, "validation.password.tooLong");

/* ---- Form schemas ---- */

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "validation.password.currentRequired"),
});

export const registerSchema = z
  .object({
    displayName: z.string().max(255, "validation.displayName.tooLong").optional(),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "validation.password.mismatch",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "validation.password.mismatch",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "validation.password.currentRequired"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "validation.password.mismatch",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* ---- Response schemas (mirror DTO) ---- */

/** `UserDto` — displayName/avatarUrl nullable, backend có thể bỏ hẳn field. */
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  usernameChangedAt: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  nextUsernameChangeAt: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  emailVerified: z.boolean(),
  role: z.enum(["user", "admin"]),
  /*
   * `catch` chứ không phải `default`: backend luôn trả trường này (cột NOT NULL
   * có DEFAULT), nhưng token phát trước migration vẫn còn hiệu lực và
   * `/auth/me` cũ có thể thiếu nó — parse hỏng ở đây là đăng xuất cả phiên.
   */
  language: z.enum(["vi", "en"]).catch("vi"),
  displayName: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  avatarUrl: z
    .string()
    .nullish()
    .transform((v) => v ?? null),
  createdAt: z.string(),
});

/** `TokenPairDto` */
export const tokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.string(),
});

/** `AuthSessionDto` */
export const sessionSchema = tokenPairSchema.extend({ user: userSchema });
