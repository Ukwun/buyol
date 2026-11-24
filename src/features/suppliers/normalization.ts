import "server-only";

import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type { SupplierProductDocument } from "@/types/firestore";
import type { SupplierProductResult } from "./adapters";

export function deterministicSupplierProductId(supplierId: string, externalProductId: string): string {
  return createHash("sha256").update(`${supplierId}:${externalProductId.trim()}`).digest("hex");
}

export function normalizeSupplierProduct(supplierId: string, result: SupplierProductResult, existingCreatedAt?: Timestamp): SupplierProductDocument {
  const now = Timestamp.now();
  return {
    id: deterministicSupplierProductId(supplierId, result.externalProductId), supplierId, externalProductId: result.externalProductId,
    originalTitle: result.title, originalDescription: result.description, sourceImages: result.images, originalPrice: result.price,
    availability: result.availability, supplierUrl: result.supplierUrl, lastSyncedAt: now, syncStatus: "healthy",
    createdAt: existingCreatedAt ?? now, updatedAt: now,
  };
}
