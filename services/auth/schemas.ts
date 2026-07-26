import { z } from "zod";

/**
 * Hai nhóm schema:
 * - Form schema: validate input phía client (UX). Ràng buộc phải KHỚP với DTO
 *   trong OpenAPI spec, nếu không backend sẽ trả VALIDATION_FAILED sau khi
 *   form đã báo hợp lệ.
 * - Response schema: parse body backend, bắt lỗi đổi shape ngay tại chỗ.
 */

const email = z.email("Email không hợp lệ").max(320, "Email quá dài");

/** Backend: minLength 12, maxLength 128, không ép ký tự đặc biệt. */
const password = z
  .string()
  .min(12, "Mật khẩu tối thiểu 12 ký tự")
  .max(128, "Mật khẩu tối đa 128 ký tự");

/* ---- Form schemas ---- */

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const registerSchema = z
  .object({
    displayName: z.string().max(255, "Tên quá dài").optional(),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
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
  emailVerified: z.boolean(),
  role: z.enum(["user", "admin"]),
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
