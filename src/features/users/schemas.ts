/** Limits MUST equal backend/app/modules/users/schemas.py (UserUpdate). */
import { z } from "zod";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/shared/lib/password";

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name.").max(255, "Name is too long."),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/** Limits MUST equal backend/app/modules/auth/schemas.py (PasswordChangeRequest). */
const otp = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email.");

export const passwordChangeSchema = z
  .object({
    otp,
    /** Required only when the account already has a password (checked in the form). */
    currentPassword: z.string().max(PASSWORD_MAX_LENGTH, "Password is too long."),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(PASSWORD_MAX_LENGTH, "Password is too long."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/** Limits MUST equal backend/app/modules/users/schemas.py (AccountDeleteRequest). */
export const accountDeleteSchema = z.object({
  otp,
  currentPassword: z.string().max(PASSWORD_MAX_LENGTH, "Password is too long."),
});
export type AccountDeleteInput = z.infer<typeof accountDeleteSchema>;
