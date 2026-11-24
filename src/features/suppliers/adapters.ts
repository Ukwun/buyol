import type { Money } from "@/types/money";
import type { ProductImage, SupplierVariantDocument } from "@/types/firestore";

export type SupplierCapability = "productSearch" | "productDetails" | "pricing" | "inventory" | "procurement" | "fulfillment";
export type SupplierAdapterErrorCode = "not-configured" | "unsupported" | "rate-limited" | "provider-error";

export interface SupplierAdapterContext { supplierId: string; credentials?: Record<string, string>; }
export interface SupplierProductResult {
  externalProductId: string;
  title: string;
  description?: string;
  images: ProductImage[];
  price?: Money;
  availability: "available" | "unavailable" | "unknown";
  supplierUrl?: string;
  variants: SupplierVariantDocument[];
}
export interface SupplierAdapter {
  provider: "1688" | "alibaba" | "custom";
  capabilities: readonly SupplierCapability[];
  isConfigured(): boolean;
  searchProducts?(context: SupplierAdapterContext, query: string): Promise<SupplierProductResult[]>;
  getProduct?(context: SupplierAdapterContext, externalProductId: string): Promise<SupplierProductResult>;
  getPrice?(context: SupplierAdapterContext, externalProductId: string): Promise<Money | undefined>;
  getAvailability?(context: SupplierAdapterContext, externalProductId: string): Promise<SupplierProductResult["availability"]>;
}

class UnconfiguredSupplierAdapter implements SupplierAdapter {
  constructor(public readonly provider: "1688" | "alibaba", public readonly capabilities: readonly SupplierCapability[] = []) {}
  isConfigured(): boolean { return false; }
  private unavailable(): never { throw new Error(`${this.provider} integration is not configured with an authorized API adapter.`); }
  async searchProducts(): Promise<SupplierProductResult[]> { return this.unavailable(); }
  async getProduct(): Promise<SupplierProductResult> { return this.unavailable(); }
  async getPrice(): Promise<Money | undefined> { return this.unavailable(); }
  async getAvailability(): Promise<SupplierProductResult["availability"]> { return this.unavailable(); }
}

const adapters: Record<string, SupplierAdapter> = {
  "1688": new UnconfiguredSupplierAdapter("1688"),
  alibaba: new UnconfiguredSupplierAdapter("alibaba"),
};

export function registerSupplierAdapter(adapter: SupplierAdapter): void { adapters[adapter.provider] = adapter; }
export function resolveSupplierAdapter(provider: string): SupplierAdapter | null { return adapters[provider] ?? null; }
export function assertSupplierCapability(adapter: SupplierAdapter, capability: SupplierCapability): void {
  if (!adapter.isConfigured()) throw new Error(`${adapter.provider} integration is not configured.`);
  if (!adapter.capabilities.includes(capability)) throw new Error(`${adapter.provider} does not support ${capability}.`);
}
