import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

describe("authentication redirects", () => {
  it("allows internal paths and rejects external destinations", () => {
    expect(getSafeRedirectPath("/vendor?tab=orders")).toBe("/vendor?tab=orders");
    expect(getSafeRedirectPath("https://evil.example/account")).toBe("/account");
    expect(getSafeRedirectPath("//evil.example/account")).toBe("/account");
    expect(getSafeRedirectPath(undefined, "/sign-in")).toBe("/sign-in");
  });
});
