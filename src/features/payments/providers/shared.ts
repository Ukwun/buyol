import { makeMoney } from "@/lib/money";
import { currencyMinorUnits } from "@/lib/money/currency";
import type { CurrencyCode, Money } from "@/types/money";
import { PaymentProviderError } from "./types";

export function safeEqual(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right || left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

export function parseProviderMoney(value: unknown, currency: CurrencyCode): Money {
  const units = currencyMinorUnits(currency);
  const text = String(value);
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new PaymentProviderError("Provider returned an invalid amount.", "invalid_amount");
  const [whole, fraction = ""] = text.split(".");
  if (fraction.length > units && /[^0]/.test(fraction.slice(units))) throw new PaymentProviderError("Provider amount precision is invalid.", "invalid_amount");
  const minor = Number(`${whole}${fraction.padEnd(units, "0").slice(0, units)}` || "0");
  return makeMoney(minor, currency);
}

export function formatMajorUnits(money: Money): string {
  const units = currencyMinorUnits(money.currency);
  if (units === 0) return String(money.amountMinor);
  const raw = String(money.amountMinor).padStart(units + 1, "0");
  return `${raw.slice(0, -units)}.${raw.slice(-units)}`;
}

export async function providerJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  const body = (await response.json().catch(() => null)) as T & { message?: string } | null;
  if (!response.ok) throw new PaymentProviderError(body?.message || "The payment provider request failed.", `http_${response.status}`);
  return body as T;
}
