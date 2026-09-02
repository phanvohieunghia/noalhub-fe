import { z } from "zod";

/**
 * Two groups of schemas:
 * - Form schemas: client-side input validation (UX). The constraints must MATCH
 *   the DTOs in the OpenAPI spec, or the backend answers VALIDATION_FAILED
 *   after the form already called the input valid.
 * - Response schemas: parse the backend's body, catching shape changes on the
 *   spot.
 */

const email = z.email("validation.email.invalid").max(320, "validation.email.tooLong");

/** Backend: minLength 12, maxLength 128, no special-character requirement. */
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

/** `UserDto` — displayName/avatarUrl are nullable, and the backend may omit the field entirely. */
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
   * `catch` rather than `default`: the backend always returns this field (a NOT
   * NULL column with a DEFAULT), but tokens issued before the migration are
   * still valid and an older `/auth/me` may lack it — a parse failure here logs
   * the whole session out.
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
