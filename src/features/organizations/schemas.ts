/** Limits MUST equal backend/app/modules/organizations/schemas.py. */
import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().trim().min(1, "Enter a workspace name.").max(255, "Name is too long."),
  country: z.string().length(2, "Choose a country."),
  baseCurrency: z.string().length(3, "Choose a currency."),
});
export type WorkspaceInput = z.infer<typeof workspaceSchema>;

export const INVITE_ROLES = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
] as const;

export const inviteSchema = z.object({
  email: z.string().trim().min(1, "Enter an email address.").pipe(z.email("Enter a valid email address.")),
  role: z.enum(["member", "admin"]),
});
export type InviteInput = z.infer<typeof inviteSchema>;
