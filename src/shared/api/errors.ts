/**
 * Every API failure becomes an ApiError. The backend's error envelope is
 * `{ data: null, meta: {}, error: { message, details } }`
 * (see backend/.claude/rules/08-errors-logging.md).
 */

export type ErrorDetails = Record<string, unknown>;

export class ApiError extends Error {
  readonly status: number;
  readonly details: ErrorDetails;

  constructor(message: string, status: number, details: ErrorDetails = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function parseErrorResponse(response: Response): Promise<ApiError> {
  const fallback = response.statusText || "Something went wrong. Try again.";
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return new ApiError(fallback, response.status);
  }

  if (isRecord(body) && isRecord(body.error)) {
    const { message, details } = body.error;
    return new ApiError(
      typeof message === "string" ? message : fallback,
      response.status,
      isRecord(details) ? details : {},
    );
  }
  // Legacy FastAPI shape: { detail: "..." }
  if (isRecord(body) && typeof body.detail === "string") {
    return new ApiError(body.detail, response.status);
  }
  return new ApiError(fallback, response.status);
}

/** Maps a 422 `details.errors[]` to `{ fieldName: message }` (field = last segment of "body -> email"). */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.status !== 422) return {};
  const errors = error.details.errors;
  if (!Array.isArray(errors)) return {};

  const result: Record<string, string> = {};
  for (const item of errors) {
    if (!isRecord(item) || typeof item.field !== "string" || typeof item.message !== "string") continue;
    const field = item.field.split(" -> ").at(-1);
    if (field) result[field] = item.message;
  }
  return result;
}

/** A message that is safe to show in the UI. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Try again."): string {
  if (error instanceof ApiError && error.message) return error.message;
  return fallback;
}
