import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { PaystackAdapter } from "./paystack";
import { FlutterwaveAdapter } from "./flutterwave";

describe("payment provider adapters", () => {
  beforeEach(() => { vi.stubEnv("PAYSTACK_SECRET_KEY", "paystack-secret"); vi.stubEnv("PAYSTACK_WEBHOOK_SECRET", "paystack-webhook"); vi.stubEnv("FLUTTERWAVE_SECRET_KEY", "flutterwave-secret"); vi.stubEnv("FLUTTERWAVE_SECRET_HASH", "flutterwave-hash"); });
  it("validates Paystack HMAC signatures and normalizes success events", () => { const raw = JSON.stringify({ event: "charge.success", id: "evt-1", data: { id: 42, reference: "buyol_ref", status: "success", amount: 12500, currency: "NGN" } }); const headers = new Headers({ "x-paystack-signature": createHmac("sha512", "paystack-webhook").update(raw).digest("hex") }); const adapter = new PaystackAdapter(); expect(adapter.validateWebhookSignature(raw, headers)).toBe(true); expect(adapter.normalizeWebhook(raw, headers).status).toBe("succeeded"); expect(adapter.validateWebhookSignature(raw + "x", headers)).toBe(false); });
  it("uses Flutterwave's secret hash and decimal money parsing", () => { const raw = JSON.stringify({ event: "charge.completed", id: "evt-2", data: { id: 99, tx_ref: "fw_ref", status: "successful", amount: "125.50", currency: "USD" } }); const adapter = new FlutterwaveAdapter(); expect(adapter.validateWebhookSignature(raw, new Headers({ "verif-hash": "flutterwave-hash" }))).toBe(true); const event = adapter.normalizeWebhook(raw, new Headers()); expect(event.amount.amountMinor).toBe(12550); expect(event.status).toBe("succeeded"); });
  it("does not call providers until initialization is requested", () => { expect(new PaystackAdapter().isConfigured()).toBe(true); expect(new FlutterwaveAdapter().isConfigured()).toBe(true); });
});
