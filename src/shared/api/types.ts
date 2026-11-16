/** Short alias for generated backend schemas: `Schema<"LoginResponse">`. */
import type { components } from "./schema";

export type Schema<Name extends keyof components["schemas"]> = components["schemas"][Name];
