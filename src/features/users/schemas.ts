/** Limits MUST equal backend/app/modules/users/schemas.py (UserUpdate). */
import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name.").max(255, "Name is too long."),
});
export type ProfileInput = z.infer<typeof profileSchema>;
