/** Form schemas. Limits MUST equal backend/app/modules/auth/schemas.py. */

import { z } from "zod";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/shared/lib/password";

const email = z.string().trim().min(1, "Enter your email address.").pipe(z.email("Enter a valid email address."));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH, "Password is too long."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name.").max(255, "Name is too long."),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(PASSWORD_MAX_LENGTH, "Password is too long."),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
      .max(PASSWORD_MAX_LENGTH, "Password is too long."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Responses that drive the session are validated before use. */
export const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_in: z.number(),
});
