import type { CurrencyCode, ExchangeRateSnapshot, Money } from "./money";
import type { FirestoreTimestamp } from "./timestamps";

export type UserStatus = "active" | "suspended" | "deleted";
export type VendorMembershipRole =
  | "owner"
  | "manager"
  | "catalog_manager"
  | "fulfillment_manager"
  | "finance_manager"
  | "support_agent";

export interface UserDocument {
  id: string;
  email: string;
  displayName?: string;
    phoneNumber?: string;
  photoUrl?: string;
  countryCode?: string;
  defaultCurrency?: CurrencyCode;
  status: UserStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface VendorPermissions {
  manageStore: boolean;
  manageCatalog: boolean;
  manageInventory: boolean;
  manageOrders: boolean;
  viewFinance: boolean;
  manageSupport: boolean;
}

export interface VendorMembershipDocument {
  id: string;
  vendorId: string;
  userId: string;
  role: VendorMembershipRole;
  permissions: VendorPermissions;
  status: "pending" | "active" | "suspended" | "revoked";
  invitedByUserId?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface VendorStoreDocument {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  logoStoragePath?: string;
  bannerStoragePath?: string;
  countryCode: string;
  settlementCurrency: CurrencyCode;
  status: "pending" | "active" | "suspended" | "closed";
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export type VendorApplicationStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "suspended";
export type VendorBusinessType = "individual" | "registered_business" | "company" | "other";
export type VendorContactMethod = "email" | "phone";

export interface VendorApplicationDocument {
  id: string;
  applicantUserId: string;
  personal: {
    fullLegalName: string;
    contactEmail: string;
    phoneNumber: string;
    countryCode: string;
    preferredContactMethod: VendorContactMethod;
  };
  business: {
    tradingName: string;
    businessType: VendorBusinessType;
    registrationCountryCode: string;
    registrationNumber?: string;
    address: AddressSnapshot;
    contactEmail: string;
    phoneNumber: string;
    website?: string;
  };
  store: {
    name: string;
    slug: string;
    description: string;
    countryCode: string;
    settlementCurrency: CurrencyCode;
    logoStoragePath?: string;
    bannerStoragePath?: string;
  };
  status: VendorApplicationStatus;
  rejectionReason?: string;
  vendorId?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  submittedAt?: FirestoreTimestamp;
}

export type VerificationStatus = "pending" | "submitted" | "verified" | "rejected" | "expired";

export interface VendorVerificationDocument {
  id: string;
  applicationId: string;
  applicantUserId: string;
  status: VerificationStatus;
  businessType: VendorBusinessType;
  countryCode: string;
  requiredDocumentTypes: string[];
  submittedDocumentPaths: string[];
  reviewerUserId?: string;
  rejectionReason?: string;
  reviewedAt?: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CategoryDocument {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string;
  path: string[];
  imageUrl?: string;
  status: "active" | "inactive";
  sortOrder: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ProductImage {
  url?: string;
  alt?: string;
  storagePath?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface ProductVariantSummary {
  id: string;
  title: string;
  sku: string;
  price: Money;
}

export interface VendorListingDocument {
  id: string;
  vendorId: string;
  supplierProductId?: string;
  categoryIds: string[];
  title: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  slug: string;
  sku?: string;
  sellingPrice?: Money;
  compareAtPrice?: Money;
  tags?: string[];
  attributes?: Record<string, string>;
  images: ProductImage[];
  variantSummaries: ProductVariantSummary[];
  inventoryPolicy: "managed" | "unmanaged" | "supplier-synced";
  publicationStatus: "draft" | "pending" | "published" | "unpublished" | "rejected";
  rejectionReason?: string;
  archivedAt?: FirestoreTimestamp;
  supplierSource?: {
    supplierId: string;
    supplierProductId: string;
    importId?: string;
    syncMode: "manual" | "price-only" | "inventory-only" | "full";
  };
  ratingAverage?: number;
  reviewCount?: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  publishedAt?: FirestoreTimestamp;
}

export interface VendorVariantDocument {
  id: string;
  sku: string;
  title: string;
  attributes: Record<string, string>;
  sellingPrice: Money;
  compareAtPrice?: Money;
  imageUrl?: string;
  inventoryId?: string;
  status: "active" | "inactive";
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface SupplierDocument {
  id: string;
  name: string;
  provider: "1688" | "alibaba" | "custom";
  countryCode: string;
  integrationStatus: "active" | "inactive" | "error";
  capabilities?: Record<string, boolean>;
  supportedCapabilities: Record<
    "productSearch" | "productDetails" | "pricing" | "inventory" | "procurement" | "fulfillment",
    boolean
  >;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface SupplierProductDocument {
  id: string;
  supplierId: string;
  externalProductId: string;
  originalTitle: string;
  originalDescription?: string;
  sourceImages: ProductImage[];
  originalPrice?: Money;
  availability: "available" | "unavailable" | "unknown";
  supplierUrl?: string;
  lastSyncedAt: FirestoreTimestamp;
  syncStatus: "healthy" | "stale" | "error";
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface SupplierVariantDocument {
  id: string;
  externalVariantId: string;
  title?: string;
  attributes: Record<string, string>;
  sourceSku?: string;
  price?: Money;
  availability: "available" | "unavailable" | "unknown";
  updatedAt: FirestoreTimestamp;
}

export interface ProductImportDocument {
  id: string;
  supplierId: string;
  supplierProductId: string;
  vendorId: string;
  targetListingId?: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  requestedByUserId: string;
  importedFields: string[];
  errorCode?: string;
  errorMessage?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  completedAt?: FirestoreTimestamp;
}

export interface SupplierPriceDocument {
  id: string;
  supplierId: string;
  supplierProductId: string;
  variantId?: string;
  price: Money;
  capturedAt: FirestoreTimestamp;
  sourceUpdatedAt?: FirestoreTimestamp;
}

export interface InventoryDocument {
  id: string;
  listingId: string;
  variantId?: string;
  vendorId: string;
  sku: string;
  onHand: number;
  reserved: number;
  reservationVersion: number;
  status: "active" | "out-of-stock" | "disabled";
  lowStockThreshold?: number;
  updatedAt: FirestoreTimestamp;
}

export interface InventoryAdjustmentDocument {
  id: string;
  inventoryId: string;
  vendorId: string;
  actorUserId: string;
  idempotencyKey: string;
  delta: number;
  previousOnHand: number;
  nextOnHand: number;
  reason: string;
  createdAt: FirestoreTimestamp;
}

export interface InventoryReservationDocument {
  id: string;
  inventoryId: string;
  parentOrderId: string;
  customerId: string;
  quantity: number;
  status: "active" | "confirmed" | "released" | "expired";
  expiresAt: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  releasedAt?: FirestoreTimestamp;
  orderId?: string;
  vendorOrderId?: string;
}

export interface InventoryReservationEventDocument {
  id: string;
  reservationId: string;
  inventoryId: string;
  orderId: string;
  type: "reserved" | "released" | "expired" | "confirmed";
  quantity: number;
  createdAt: FirestoreTimestamp;
}

export interface CartDocument {
  customerId: string;
  currency: CurrencyCode;
  itemCount: number;
  updatedAt: FirestoreTimestamp;
}

export interface CartItemDocument {
  id: string;
  listingId: string;
  variantId?: string;
  vendorId: string;
  sku: string;
  quantity: number;
  addedAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface WishlistItemDocument {
  id: string;
  listingId: string;
  addedAt: FirestoreTimestamp;
}

export interface AddressSnapshot {
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  deliveryInstructions?: string;
}

export interface OrderItemSnapshot {
  listingId: string;
  variantId?: string;
  vendorId: string;
  sku: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: Money;
  lineSubtotal: Money;
  customerCurrencyPrice: Money;
  supplierPriceSnapshot?: Money;
  exchangeRateSnapshot?: ExchangeRateSnapshot;
}

export interface ParentOrderDocument {
  id: string;
  customerId: string;
  vendorOrderIds: string[];
  customerCurrency: CurrencyCode;
  subtotal: Money;
  shippingTotal: Money;
  taxTotal: Money;
  discountTotal: Money;
  total: Money;
  paymentStatus: "pending" | "partially-paid" | "paid" | "partially-refunded" | "refunded" | "failed";
  fulfillmentStatus: "pending" | "processing" | "partially-shipped" | "shipped" | "partially-delivered" | "delivered" | "cancelled";
  shippingAddressSnapshot: AddressSnapshot;
  priceSnapshotVersion: number;
  idempotencyKey: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  orderStatus?: "pending_payment" | "payment_processing" | "paid" | "processing" | "partially_fulfilled" | "fulfilled" | "cancelled" | "expired" | "refunded" | "partially_refunded";
  quoteId?: string;
}

export interface VendorOrderDocument {
  id: string;
  parentOrderId: string;
  vendorId: string;
  customerId: string;
  items: OrderItemSnapshot[];
  orderCurrency: CurrencyCode;
  settlementCurrency: CurrencyCode;
  subtotal: Money;
  shippingTotal: Money;
  taxTotal: Money;
  discountTotal: Money;
  total: Money;
  commissionTotal: Money;
  vendorNetTotal: Money;
  paymentStatus: "pending" | "paid" | "partially-refunded" | "refunded";
  fulfillmentStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  settlementStatus: "pending" | "eligible" | "included" | "paid";
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  orderStatus?: ParentOrderDocument["orderStatus"];
  shippingSnapshot?: Record<string, string | number | boolean>;
  taxSnapshot?: Record<string, string | number | boolean>;
}

export interface FulfillmentAddressDocument extends AddressSnapshot {
  id: string;
  parentOrderId: string;
  vendorOrderId: string;
  vendorId: string;
  customerId: string;
  createdAt: FirestoreTimestamp;
}

export interface PaymentAttemptDocument {
  id: string;
  parentOrderId: string;
  customerId: string;
  provider: "paystack" | "flutterwave";
  idempotencyKey: string;
    internalReference: string;
    providerReference?: string;
    providerTransactionId?: string;
  amount: Money;
    status: "pending" | "initializing" | "requires_action" | "processing" | "succeeded" | "failed" | "abandoned" | "cancelled" | "expired" | "partially_refunded" | "refunded";
    failureCode?: string;
    failureReason?: string;
    safeProviderMetadata?: Record<string, string | number | boolean | null>;
    expiresAt?: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  verifiedAt?: FirestoreTimestamp;
    lastVerifiedAt?: FirestoreTimestamp;
}

export interface PaymentEventDocument {
  id: string;
  provider: "paystack" | "flutterwave";
  providerEventId: string;
  paymentId?: string;
  parentOrderId?: string;
  eventType: string;
  signatureVerified: boolean;
  processingStatus: "received" | "processed" | "ignored" | "failed";
    amount?: Money;
    providerReference?: string;
    safeMetadata?: Record<string, string | number | boolean | null>;
  receivedAt: FirestoreTimestamp;
  processedAt?: FirestoreTimestamp;
}

  export interface PaymentReconciliationExceptionDocument {
    id: string;
    provider: "paystack" | "flutterwave";
    paymentId?: string;
    parentOrderId?: string;
    reason: string;
    status: "open" | "resolved";
    safeMetadata?: Record<string, string | number | boolean | null>;
    createdAt: FirestoreTimestamp;
    resolvedAt?: FirestoreTimestamp;
  }

export interface RefundDocument {
  id: string;
  parentOrderId: string;
  vendorOrderId?: string;
  paymentId: string;
  orderItemIds: string[];
  requestedAmount: Money;
  approvedAmount?: Money;
  providerRefundReference?: string;
  status: "requested" | "processing" | "completed" | "failed" | "cancelled";
  reason: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CommissionDocument {
  id: string;
  parentOrderId: string;
  vendorOrderId: string;
  vendorId: string;
  orderItemId?: string;
  basisAmount: Money;
  rateBasisPoints?: number;
  fixedAmount?: Money;
  commissionAmount: Money;
  status: "pending" | "earned" | "reversed" | "adjusted";
  reversalOfCommissionId?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface SettlementDocument {
  id: string;
  vendorId: string;
  settlementCurrency: CurrencyCode;
  grossAmount: Money;
  commissionAmount: Money;
  refundAdjustments: Money;
  otherAdjustments: Money;
  netAmount: Money;
  status: "pending" | "approved" | "processing" | "paid" | "failed";
  periodStart: FirestoreTimestamp;
  periodEnd: FirestoreTimestamp;
  payoutReference?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface SettlementEntryDocument {
  id: string;
  settlementId: string;
  vendorId: string;
  sourceType: "vendorOrder" | "commission" | "refund" | "adjustment";
  sourceId: string;
  amount: Money;
  createdAt: FirestoreTimestamp;
}

export interface ShipmentDocument {
  id: string;
  parentOrderId: string;
  vendorOrderId: string;
  vendorId: string;
  carrier?: string;
  serviceLevel?: string;
  trackingNumber?: string;
  originCountry?: string;
  destinationCountry: string;
  status: "pending" | "label-created" | "in-transit" | "out-for-delivery" | "delivered" | "exception" | "cancelled";
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ReviewDocument {
  id: string;
  listingId: string;
  vendorId: string;
  customerId: string;
  orderId: string;
  vendorOrderId: string;
  orderItemId: string;
  rating: number;
  title?: string;
  body: string;
  verifiedPurchase: boolean;
  status: "pending" | "published" | "rejected" | "removed";
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface PromotionDocument {
  id: string;
  ownerType: "platform" | "vendor";
  ownerId?: string;
  code?: string;
  type: "percentage" | "fixed" | "free-shipping";
  rateBasisPoints?: number;
  fixedAmount?: Money;
  eligibleListingIds?: string[];
  eligibleCategoryIds?: string[];
  minimumSubtotal?: Money;
  usageLimit?: number;
  usageCount: number;
  startsAt: FirestoreTimestamp;
  endsAt: FirestoreTimestamp;
  status: "draft" | "active" | "paused" | "expired";
}

export interface SupportTicketDocument {
  id: string;
  customerId?: string;
  vendorId?: string;
  orderId?: string;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assignedTo?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface DisputeDocument {
  id: string;
  customerId?: string;
  vendorId?: string;
  orderId?: string;
  paymentId?: string;
  reason: string;
  status: "open" | "investigating" | "resolved" | "rejected";
  resolution?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface NotificationDocument {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt?: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
}

export interface AuditLogDocument {
  id: string;
  actorUserId?: string;
  actorType: "user" | "system" | "admin";
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, string | number | boolean>;
  createdAt: FirestoreTimestamp;
}
