export const SESSION_COOKIE_NAME = "buyol_session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_MS / 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
