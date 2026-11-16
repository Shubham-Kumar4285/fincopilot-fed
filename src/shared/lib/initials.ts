/** "Arjun Mehta" → "AM", "priya@x.in" → "PR". */
export function initials(nameOrEmail: string): string {
  const words = nameOrEmail.trim().split(/[\s@._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1 || nameOrEmail.includes("@")) return (words[0] ?? "").slice(0, 2).toUpperCase();
  return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
}
