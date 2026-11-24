import { describe, expect, it } from "vitest";
import { resetPasswordSchema, signInSchema, signUpSchema } from "@/features/auth/schemas";

describe("authentication schemas", () => {
  it("requires a valid email and password length", () => {
    expect(signInSchema.safeParse({ email: "bad", password: "short" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "user@example.com", password: "password123" }).success).toBe(true);
  });

  it("requires matching registration passwords", () => {
    expect(signUpSchema.safeParse({ displayName: "User", email: "user@example.com", password: "password123", confirmPassword: "different" }).success).toBe(false);
  });

  it("keeps password reset input limited to an email", () => {
    expect(resetPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
