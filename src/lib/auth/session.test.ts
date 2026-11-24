import { describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session-config";

describe("session cookie configuration", () => {
  it("uses an HttpOnly SameSite cookie with a bounded lifetime", () => {
    const options = sessionCookieOptions();
    expect(SESSION_COOKIE_NAME).toBe("buyol_session");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBeGreaterThan(0);
  });
});
