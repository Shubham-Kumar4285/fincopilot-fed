/** "arjun@studio.in" → "ar***@studio.in". Used when showing someone else's address. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}
