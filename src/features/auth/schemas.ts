import { z } from "zod";
import { isCurrencyCode } from "@/lib/money";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: passwordSchema,
  redirect: z.string().optional(),
});

export const signUpSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name.").max(80, "Name is too long."),
  phoneNumber: z.string().trim().min(5, "Enter a valid phone number.").max(30, "Phone number is too long."),
  email: z.string().trim().email("Enter a valid email address."),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const sessionRequestSchema = z.object({ idToken: z.string().min(1) });

export const syncUserRequestSchema = z.object({
  idToken: z.string().min(1),
  displayName: z.string().trim().min(2).max(80).optional(),
  phoneNumber: z.string().trim().min(5).max(30).optional(),
  countryCode: z.string().trim().length(2).toUpperCase().optional(),
  defaultCurrency: z.string().refine(isCurrencyCode, "Unsupported currency code.").optional(),
});
