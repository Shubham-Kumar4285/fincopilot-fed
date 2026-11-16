import type { z } from "zod";

/** First error message per field from a failed Zod parse: `{ email: "Enter a valid email address." }`. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in result)) result[field] = issue.message;
  }
  return result;
}
