/** The only place that reads import.meta.env. Validated once at startup. */

import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.url().default("http://localhost:8000/v1"),
});

const result = envSchema.safeParse({ VITE_API_URL: import.meta.env.VITE_API_URL });

if (!result.success) {
  // eslint-disable-next-line no-console -- startup failure must be visible to the developer
  console.error("Invalid environment variables:", z.treeifyError(result.error));
  throw new Error("Invalid environment variables. Check the console.");
}

export const env = result.data;
