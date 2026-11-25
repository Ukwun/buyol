import { z } from "zod";
import { isCurrencyCode } from "@/lib/money";

const timestampSchema = z.object({ seconds: z.number().int(), nanoseconds: z.number().int() });
const currencySchema = z.string().refine(isCurrencyCode, "Unsupported ISO 4217 currency code");
const moneySchema = z.object({ amountMinor: z.number().int().safe(), currency: currencySchema });
const imageSchema = z.object({ url: z.string().url().optional(), alt: z.string().max(200).optional(), storagePath: z.string().optional(), sortOrder: z.number().int().nonnegative().optional(), isPrimary: z.boolean().optional() });

export const userSchema = z.object({
  id: z.string().min(1), email: z.string().email(), displayName: z.string().optional(), phoneNumber: z.string().trim().min(5).max(30).optional(), photoUrl: z.string().url().optional(),
  countryCode: z.string().length(2).optional(), defaultCurrency: currencySchema.optional(), status: z.enum(["active", "suspended", "deleted"]),
  createdAt: timestampSchema, updatedAt: timestampSchema,
});

export const vendorMembershipSchema = z.object({
  id: z.string().min(1), vendorId: z.string().min(1), userId: z.string().min(1),
  role: z.enum(["owner", "manager", "catalog_manager", "fulfillment_manager", "finance_manager", "support_agent"]),
  permissions: z.object({ manageStore: z.boolean(), manageCatalog: z.boolean(), manageInventory: z.boolean(), manageOrders: z.boolean(), viewFinance: z.boolean(), manageSupport: z.boolean() }),
  status: z.enum(["pending", "active", "suspended", "revoked"]), invitedByUserId: z.string().optional(), createdAt: timestampSchema, updatedAt: timestampSchema,
});

export const vendorStoreSchema = z.object({
  id: z.string(), ownerUserId: z.string(), name: z.string().min(1), slug: z.string().min(1), description: z.string().optional(), logoUrl: z.string().url().optional(), bannerUrl: z.string().url().optional(), logoStoragePath: z.string().optional(), bannerStoragePath: z.string().optional(),
  countryCode: z.string().length(2), settlementCurrency: currencySchema, status: z.enum(["pending", "active", "suspended", "closed"]), createdAt: timestampSchema, updatedAt: timestampSchema,
});

const addressInputSchema = z.object({
  recipientName: z.string().trim().min(1).max(120), phoneNumber: z.string().trim().min(5).max(30),
  addressLine1: z.string().trim().min(1).max(160), addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(1).max(80), region: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(30).optional(), countryCode: z.string().length(2),
});

export const vendorApplicationInputSchema = z.object({
  personal: z.object({
    fullLegalName: z.string().trim().min(2).max(120), contactEmail: z.string().email(),
    phoneNumber: z.string().trim().min(5).max(30), countryCode: z.string().length(2),
    preferredContactMethod: z.enum(["email", "phone"]),
  }),
  business: z.object({
    tradingName: z.string().trim().min(2).max(160), businessType: z.enum(["individual", "registered_business", "company", "other"]),
    registrationCountryCode: z.string().length(2), registrationNumber: z.string().trim().max(80).optional(),
    address: addressInputSchema, contactEmail: z.string().email(), phoneNumber: z.string().trim().min(5).max(30),
    website: z.string().url().optional().or(z.literal("")),
  }),
  store: z.object({
    name: z.string().trim().min(2).max(100), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(60),
    description: z.string().trim().min(20).max(1000), countryCode: z.string().length(2), settlementCurrency: currencySchema,
    logoStoragePath: z.string().optional(), bannerStoragePath: z.string().optional(),
  }),
});

export const vendorApplicationPatchSchema = vendorApplicationInputSchema.partial({ personal: true, business: true, store: true });
export const vendorReviewSchema = z.object({ decision: z.enum(["under_review", "approved", "rejected", "suspended"]), rejectionReason: z.string().trim().max(1000).optional() });
export const vendorVerificationSchema = z.object({ applicationId: z.string().min(1), documentPaths: z.array(z.string().min(1)).max(10) });

export const categorySchema = z.object({
  id: z.string(), name: z.string().min(1), slug: z.string().min(1), parentCategoryId: z.string().optional(), path: z.array(z.string()), imageUrl: z.string().url().optional(),
  status: z.enum(["active", "inactive"]), sortOrder: z.number().int(), createdAt: timestampSchema, updatedAt: timestampSchema,
});

const productVariantSummarySchema = z.object({ id: z.string(), title: z.string(), sku: z.string(), price: moneySchema });
const productVariantSchema = z.object({ id: z.string(), sku: z.string(), title: z.string(), attributes: z.record(z.string(), z.string()), sellingPrice: moneySchema, compareAtPrice: moneySchema.optional(), imageUrl: z.string().url().optional(), inventoryId: z.string().optional(), status: z.enum(["active", "inactive"]), createdAt: timestampSchema, updatedAt: timestampSchema });

const nonNegativeMoneySchema = z.object({ amountMinor: z.number().int().nonnegative().safe(), currency: currencySchema });
export const vendorVariantInputSchema = z.object({ id: z.string().optional(), sku: z.string().trim().min(1).max(100), title: z.string().trim().min(1).max(160), attributes: z.record(z.string().trim().min(1).max(80), z.string().trim().min(1).max(120)).default({}), sellingPrice: nonNegativeMoneySchema, compareAtPrice: nonNegativeMoneySchema.optional(), imageUrl: z.string().url().optional(), status: z.enum(["active", "inactive"]).default("active") }).refine((value) => !value.compareAtPrice || value.compareAtPrice.currency === value.sellingPrice.currency, "Variant prices must use the same currency").refine((value) => !value.compareAtPrice || value.compareAtPrice.amountMinor >= value.sellingPrice.amountMinor, "Compare-at price must not be below the selling price");
export const vendorProductInputSchema = z.object({
  title: z.string().trim().min(1).max(180), description: z.string().trim().min(1).max(10000), shortDescription: z.string().trim().max(300).optional(), brand: z.string().trim().max(120).optional(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(120), sku: z.string().trim().max(100).optional(), sellingPrice: nonNegativeMoneySchema.optional(), compareAtPrice: nonNegativeMoneySchema.optional(), tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]), attributes: z.record(z.string(), z.string()).default({}), categoryIds: z.array(z.string().min(1)).min(1).max(10), images: z.array(imageSchema).max(20).default([]),
  inventoryPolicy: z.enum(["managed", "unmanaged", "supplier-synced"]), variants: z.array(vendorVariantInputSchema).max(100).default([]),
}).refine((value) => new Set(value.variants.map((variant) => variant.sku.toLowerCase())).size === value.variants.length, "Variant SKUs must be unique").refine((value) => value.variants.length > 0 || (Boolean(value.sku) && Boolean(value.sellingPrice)), "A product without variants requires a SKU and selling price").refine((value) => !value.compareAtPrice || !value.sellingPrice || value.compareAtPrice.currency === value.sellingPrice.currency, "Product prices must use the same currency").refine((value) => !value.compareAtPrice || !value.sellingPrice || value.compareAtPrice.amountMinor >= value.sellingPrice.amountMinor, "Compare-at price must not be below the selling price");

export const vendorListingSchema = z.object({
  id: z.string(), vendorId: z.string(), supplierProductId: z.string().optional(), categoryIds: z.array(z.string()), title: z.string().min(1), description: z.string(), shortDescription: z.string().optional(), brand: z.string().optional(), sku: z.string().optional(), sellingPrice: moneySchema.optional(), compareAtPrice: moneySchema.optional(), tags: z.array(z.string()).optional(), attributes: z.record(z.string(), z.string()).optional(), slug: z.string(), images: z.array(imageSchema), variantSummaries: z.array(productVariantSummarySchema),
  inventoryPolicy: z.enum(["managed", "unmanaged", "supplier-synced"]), publicationStatus: z.enum(["draft", "pending", "published", "unpublished", "rejected"]),
  supplierSource: z.object({ supplierId: z.string(), supplierProductId: z.string(), importId: z.string().optional(), syncMode: z.enum(["manual", "price-only", "inventory-only", "full"]) }).optional(),
  ratingAverage: z.number().min(0).max(5).optional(), reviewCount: z.number().int().nonnegative().optional(), createdAt: timestampSchema, updatedAt: timestampSchema, publishedAt: timestampSchema.optional(),
});
export const vendorVariantSchema = productVariantSchema;

export const supplierSchema = z.object({
  id: z.string(), name: z.string().min(1), provider: z.enum(["1688", "alibaba", "custom"]), countryCode: z.string().length(2), integrationStatus: z.enum(["active", "inactive", "error"]),
  supportedCapabilities: z.record(z.enum(["productSearch", "productDetails", "pricing", "inventory", "procurement", "fulfillment"]), z.boolean()), createdAt: timestampSchema, updatedAt: timestampSchema,
});
export const supplierProductSchema = z.object({
  id: z.string(), supplierId: z.string(), externalProductId: z.string(), originalTitle: z.string(), originalDescription: z.string().optional(), sourceImages: z.array(imageSchema), originalPrice: moneySchema.optional(), availability: z.enum(["available", "unavailable", "unknown"]), supplierUrl: z.string().url().optional(), lastSyncedAt: timestampSchema, syncStatus: z.enum(["healthy", "stale", "error"]), createdAt: timestampSchema, updatedAt: timestampSchema,
});
export const supplierVariantSchema = z.object({ id: z.string(), externalVariantId: z.string(), title: z.string().optional(), attributes: z.record(z.string(), z.string()), sourceSku: z.string().optional(), price: moneySchema.optional(), availability: z.enum(["available", "unavailable", "unknown"]), updatedAt: timestampSchema });
export const productImportSchema = z.object({ id: z.string(), supplierId: z.string(), supplierProductId: z.string(), vendorId: z.string(), targetListingId: z.string().optional(), status: z.enum(["queued", "processing", "completed", "failed", "cancelled"]), requestedByUserId: z.string(), importedFields: z.array(z.string()), errorCode: z.string().optional(), errorMessage: z.string().optional(), createdAt: timestampSchema, updatedAt: timestampSchema, completedAt: timestampSchema.optional() });
export const supplierPriceSchema = z.object({ id: z.string(), supplierId: z.string(), supplierProductId: z.string(), variantId: z.string().optional(), price: moneySchema, capturedAt: timestampSchema, sourceUpdatedAt: timestampSchema.optional() });

export const inventorySchema = z.object({ id: z.string(), listingId: z.string(), variantId: z.string().optional(), vendorId: z.string(), sku: z.string(), onHand: z.number().int().nonnegative(), reserved: z.number().int().nonnegative(), reservationVersion: z.number().int().nonnegative(), status: z.enum(["active", "out-of-stock", "disabled"]), lowStockThreshold: z.number().int().nonnegative().optional(), updatedAt: timestampSchema });
export const inventoryAdjustmentInputSchema = z.object({ inventoryId: z.string().optional(), listingId: z.string().min(1), variantId: z.string().optional(), sku: z.string().trim().min(1).max(100), delta: z.number().int().safe(), reason: z.string().trim().min(1).max(240), idempotencyKey: z.string().trim().min(8).max(120), lowStockThreshold: z.number().int().nonnegative().optional() });
export const inventoryReservationSchema = z.object({ id: z.string(), inventoryId: z.string(), parentOrderId: z.string(), customerId: z.string(), quantity: z.number().int().positive(), status: z.enum(["active", "confirmed", "released", "expired"]), expiresAt: timestampSchema, createdAt: timestampSchema, releasedAt: timestampSchema.optional() });
export const cartSchema = z.object({ customerId: z.string(), currency: currencySchema, itemCount: z.number().int().nonnegative(), updatedAt: timestampSchema });
export const cartItemSchema = z.object({ id: z.string(), listingId: z.string(), variantId: z.string().optional(), vendorId: z.string(), sku: z.string(), quantity: z.number().int().positive(), addedAt: timestampSchema, updatedAt: timestampSchema });
export const cartMutationSchema = z.object({ listingId: z.string().min(1), variantId: z.string().optional(), quantity: z.number().int().positive().max(1000) });
export const wishlistItemSchema = z.object({ id: z.string(), listingId: z.string(), addedAt: timestampSchema });

const addressSchema = z.object({ recipientName: z.string().trim().min(1).max(120), phoneNumber: z.string().trim().min(5).max(30), addressLine1: z.string().trim().min(1).max(160), addressLine2: z.string().trim().max(160).optional(), city: z.string().trim().min(1).max(80), region: z.string().trim().max(80).optional(), postalCode: z.string().trim().max(30).optional(), countryCode: z.string().length(2), deliveryInstructions: z.string().trim().max(500).optional() });
export const checkoutAddressSchema = addressSchema;
export const checkoutQuoteRequestSchema = z.object({ address: checkoutAddressSchema, shippingSelections: z.record(z.string(), z.string()).default({}), promotionCode: z.string().trim().max(80).optional() });
export const checkoutSubmitSchema = z.object({ quoteId: z.string().min(1), idempotencyKey: z.string().trim().min(8).max(120) });
const exchangeRateSchema = z.object({ baseCurrency: currencySchema, quoteCurrency: currencySchema, rateNumerator: z.string().regex(/^\d+$/), rateDenominator: z.string().regex(/^\d+$/), source: z.string(), capturedAt: timestampSchema, roundingMode: z.enum(["half-up", "down", "up"]) });
const orderItemSchema = z.object({ listingId: z.string(), variantId: z.string().optional(), vendorId: z.string(), sku: z.string(), title: z.string(), variantTitle: z.string().optional(), quantity: z.number().int().positive(), unitPrice: moneySchema, lineSubtotal: moneySchema, customerCurrencyPrice: moneySchema, supplierPriceSnapshot: moneySchema.optional(), exchangeRateSnapshot: exchangeRateSchema.optional() });

export const parentOrderSchema = z.object({ id: z.string(), customerId: z.string(), vendorOrderIds: z.array(z.string()), customerCurrency: currencySchema, subtotal: moneySchema, shippingTotal: moneySchema, taxTotal: moneySchema, discountTotal: moneySchema, total: moneySchema, paymentStatus: z.enum(["pending", "partially-paid", "paid", "partially-refunded", "refunded", "failed"]), fulfillmentStatus: z.enum(["pending", "processing", "partially-shipped", "shipped", "partially-delivered", "delivered", "cancelled"]), shippingAddressSnapshot: addressSchema, priceSnapshotVersion: z.number().int(), idempotencyKey: z.string(), createdAt: timestampSchema, updatedAt: timestampSchema });
export const vendorOrderSchema = z.object({ id: z.string(), parentOrderId: z.string(), vendorId: z.string(), customerId: z.string(), items: z.array(orderItemSchema), orderCurrency: currencySchema, settlementCurrency: currencySchema, subtotal: moneySchema, shippingTotal: moneySchema, taxTotal: moneySchema, discountTotal: moneySchema, total: moneySchema, commissionTotal: moneySchema, vendorNetTotal: moneySchema, paymentStatus: z.enum(["pending", "paid", "partially-refunded", "refunded"]), fulfillmentStatus: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]), settlementStatus: z.enum(["pending", "eligible", "included", "paid"]), createdAt: timestampSchema, updatedAt: timestampSchema });
export const fulfillmentAddressSchema = addressSchema.extend({ id: z.string(), parentOrderId: z.string(), vendorOrderId: z.string(), vendorId: z.string(), customerId: z.string(), createdAt: timestampSchema });

  export const paymentAttemptSchema = z.object({ id: z.string(), parentOrderId: z.string(), customerId: z.string(), provider: z.enum(["paystack", "flutterwave"]), idempotencyKey: z.string(), internalReference: z.string(), providerReference: z.string().optional(), providerTransactionId: z.string().optional(), amount: moneySchema, status: z.enum(["pending", "initializing", "requires_action", "processing", "succeeded", "failed", "abandoned", "cancelled", "expired", "partially_refunded", "refunded"]), failureCode: z.string().optional(), failureReason: z.string().optional(), safeProviderMetadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(), expiresAt: timestampSchema.optional(), createdAt: timestampSchema, updatedAt: timestampSchema, verifiedAt: timestampSchema.optional(), lastVerifiedAt: timestampSchema.optional() });
  export const paymentEventSchema = z.object({ id: z.string(), provider: z.enum(["paystack", "flutterwave"]), providerEventId: z.string(), paymentId: z.string().optional(), parentOrderId: z.string().optional(), eventType: z.string(), signatureVerified: z.boolean(), processingStatus: z.enum(["received", "processed", "ignored", "failed"]), amount: moneySchema.optional(), providerReference: z.string().optional(), safeMetadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(), receivedAt: timestampSchema, processedAt: timestampSchema.optional() });
export const refundSchema = z.object({ id: z.string(), parentOrderId: z.string(), vendorOrderId: z.string().optional(), paymentId: z.string(), orderItemIds: z.array(z.string()), requestedAmount: moneySchema, approvedAmount: moneySchema.optional(), providerRefundReference: z.string().optional(), status: z.enum(["requested", "processing", "completed", "failed", "cancelled"]), reason: z.string(), createdAt: timestampSchema, updatedAt: timestampSchema });
export const commissionSchema = z.object({ id: z.string(), parentOrderId: z.string(), vendorOrderId: z.string(), vendorId: z.string(), orderItemId: z.string().optional(), basisAmount: moneySchema, rateBasisPoints: z.number().int().nonnegative().optional(), fixedAmount: moneySchema.optional(), commissionAmount: moneySchema, status: z.enum(["pending", "earned", "reversed", "adjusted"]), reversalOfCommissionId: z.string().optional(), createdAt: timestampSchema, updatedAt: timestampSchema });
export const settlementSchema = z.object({ id: z.string(), vendorId: z.string(), settlementCurrency: currencySchema, grossAmount: moneySchema, commissionAmount: moneySchema, refundAdjustments: moneySchema, otherAdjustments: moneySchema, netAmount: moneySchema, status: z.enum(["pending", "approved", "processing", "paid", "failed"]), periodStart: timestampSchema, periodEnd: timestampSchema, payoutReference: z.string().optional(), createdAt: timestampSchema, updatedAt: timestampSchema });
export const settlementEntrySchema = z.object({ id: z.string(), settlementId: z.string(), vendorId: z.string(), sourceType: z.enum(["vendorOrder", "commission", "refund", "adjustment"]), sourceId: z.string(), amount: moneySchema, createdAt: timestampSchema });

export const shipmentSchema = z.object({ id: z.string(), parentOrderId: z.string(), vendorOrderId: z.string(), vendorId: z.string(), carrier: z.string().optional(), serviceLevel: z.string().optional(), trackingNumber: z.string().optional(), originCountry: z.string().length(2).optional(), destinationCountry: z.string().length(2), status: z.enum(["pending", "label-created", "in-transit", "out-for-delivery", "delivered", "exception", "cancelled"]), createdAt: timestampSchema, updatedAt: timestampSchema });
export const reviewSchema = z.object({ id: z.string(), listingId: z.string(), vendorId: z.string(), customerId: z.string(), orderId: z.string(), vendorOrderId: z.string(), orderItemId: z.string(), rating: z.number().int().min(1).max(5), title: z.string().optional(), body: z.string().min(1), verifiedPurchase: z.boolean(), status: z.enum(["pending", "published", "rejected", "removed"]), createdAt: timestampSchema, updatedAt: timestampSchema });
export const promotionSchema = z.object({ id: z.string(), ownerType: z.enum(["platform", "vendor"]), ownerId: z.string().optional(), code: z.string().optional(), type: z.enum(["percentage", "fixed", "free-shipping"]), rateBasisPoints: z.number().int().nonnegative().optional(), fixedAmount: moneySchema.optional(), eligibleListingIds: z.array(z.string()).optional(), eligibleCategoryIds: z.array(z.string()).optional(), minimumSubtotal: moneySchema.optional(), usageLimit: z.number().int().positive().optional(), usageCount: z.number().int().nonnegative(), startsAt: timestampSchema, endsAt: timestampSchema, status: z.enum(["draft", "active", "paused", "expired"]) });
export const supportTicketSchema = z.object({ id: z.string(), customerId: z.string().optional(), vendorId: z.string().optional(), orderId: z.string().optional(), subject: z.string(), status: z.enum(["open", "pending", "resolved", "closed"]), priority: z.enum(["low", "normal", "high", "urgent"]), assignedTo: z.string().optional(), createdAt: timestampSchema, updatedAt: timestampSchema });
export const disputeSchema = z.object({ id: z.string(), customerId: z.string().optional(), vendorId: z.string().optional(), orderId: z.string().optional(), paymentId: z.string().optional(), reason: z.string(), status: z.enum(["open", "investigating", "resolved", "rejected"]), resolution: z.string().optional(), createdAt: timestampSchema, updatedAt: timestampSchema });
export const notificationSchema = z.object({ id: z.string(), type: z.string(), title: z.string(), body: z.string(), readAt: timestampSchema.optional(), createdAt: timestampSchema });
export const auditLogSchema = z.object({ id: z.string(), actorUserId: z.string().optional(), actorType: z.enum(["user", "system", "admin"]), action: z.string(), resourceType: z.string(), resourceId: z.string(), metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])), createdAt: timestampSchema });
