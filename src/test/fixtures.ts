/** Backend-shaped test data (types from the generated OpenAPI schema). */
import { http, HttpResponse } from "msw";

import type { Schema } from "@/shared/api/types";

import { API } from "./server";

const NOW = "2026-01-01T00:00:00Z";

export const me: Schema<"UserProfileResponse"> = {
  id: "u-owner",
  email: "arjun@studio.in",
  full_name: "Arjun Mehta",
  status: "active",
  created_at: NOW,
  updated_at: NOW,
};

export const org: Schema<"OrganizationResponse"> = {
  id: "org-1",
  name: "Arjun Design Studio",
  country: "IN",
  base_currency: "INR",
  plan_tier: "team",
  created_at: NOW,
  updated_at: NOW,
  member_count: 2,
};

export const member = (
  userId: string,
  name: string,
  role: Schema<"OrgMemberResponse">["role"],
): Schema<"OrgMemberResponse"> => ({
  user_id: userId,
  org_id: org.id,
  role,
  joined_at: NOW,
  email: `${name.split(" ")[0]?.toLowerCase() ?? "x"}@studio.in`,
  full_name: name,
});

export const pendingInvite: Schema<"OrgInviteResponse"> = {
  id: "inv-1",
  org_id: org.id,
  email: "kavya@studio.in",
  role: "member",
  expires_at: "2099-01-01T00:00:00Z",
  accepted_at: null,
  created_at: NOW,
  invited_by: me.id,
  token: null,
};

/** Signed-in owner of `org` with one other member. */
export function workspaceHandlers({ role = "owner" }: { role?: Schema<"OrgMemberResponse">["role"] } = {}) {
  const members = [member(me.id, me.full_name, role), member("u-meera", "Meera Shah", "member")];
  return [
    http.get(`${API}/users/me`, () => HttpResponse.json(me)),
    http.get(`${API}/orgs/current`, () => HttpResponse.json(org)),
    http.get(`${API}/orgs/current/members`, () => HttpResponse.json({ members, total: members.length })),
    http.get(`${API}/orgs/current/invites`, () => HttpResponse.json([pendingInvite])),
  ];
}
