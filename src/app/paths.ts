export const PATHS = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
} as const;

export type AppPath = (typeof PATHS)[keyof typeof PATHS];
