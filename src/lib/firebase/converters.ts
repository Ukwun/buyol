import type { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, WithFieldValue } from "firebase/firestore";
import type {
  AuditLogDocument, CartDocument, CartItemDocument, CategoryDocument, CommissionDocument, DisputeDocument, FulfillmentAddressDocument,
  InventoryDocument, InventoryReservationDocument, InventoryAdjustmentDocument, ParentOrderDocument, PaymentAttemptDocument, PaymentEventDocument, ProductImportDocument,
  NotificationDocument, PromotionDocument, RefundDocument, ReviewDocument, SettlementDocument, SettlementEntryDocument, ShipmentDocument, SupplierDocument,
  SupplierPriceDocument, SupplierProductDocument, SupplierVariantDocument, SupportTicketDocument, UserDocument, VendorListingDocument,
  VendorMembershipDocument, VendorOrderDocument, VendorStoreDocument, VendorVariantDocument, WishlistItemDocument, VendorApplicationDocument, VendorVerificationDocument, PaymentReconciliationExceptionDocument,
} from "@/types/firestore";

export function createDocumentConverter<T>(): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: WithFieldValue<T>): DocumentData {
      const data = { ...(modelObject as unknown as Record<string, unknown>) };
      delete data.id;
      return data;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return { id: snapshot.id, ...snapshot.data() } as T;
    },
  };
}

export const userConverter = createDocumentConverter<UserDocument>();
export const vendorMembershipConverter = createDocumentConverter<VendorMembershipDocument>();
export const vendorStoreConverter = createDocumentConverter<VendorStoreDocument>();
export const vendorApplicationConverter = createDocumentConverter<VendorApplicationDocument>();
export const vendorVerificationConverter = createDocumentConverter<VendorVerificationDocument>();
export const categoryConverter = createDocumentConverter<CategoryDocument>();
export const vendorListingConverter = createDocumentConverter<VendorListingDocument>();
export const vendorVariantConverter = createDocumentConverter<VendorVariantDocument>();
export const supplierConverter = createDocumentConverter<SupplierDocument>();
export const supplierProductConverter = createDocumentConverter<SupplierProductDocument>();
export const supplierVariantConverter = createDocumentConverter<SupplierVariantDocument>();
export const productImportConverter = createDocumentConverter<ProductImportDocument>();
export const supplierPriceConverter = createDocumentConverter<SupplierPriceDocument>();
export const inventoryConverter = createDocumentConverter<InventoryDocument>();
export const inventoryAdjustmentConverter = createDocumentConverter<InventoryAdjustmentDocument>();
export const inventoryReservationConverter = createDocumentConverter<InventoryReservationDocument>();
export const cartConverter = createDocumentConverter<CartDocument>();
export const cartItemConverter = createDocumentConverter<CartItemDocument>();
export const wishlistItemConverter = createDocumentConverter<WishlistItemDocument>();
export const parentOrderConverter = createDocumentConverter<ParentOrderDocument>();
export const vendorOrderConverter = createDocumentConverter<VendorOrderDocument>();
export const fulfillmentAddressConverter = createDocumentConverter<FulfillmentAddressDocument>();
export const paymentAttemptConverter = createDocumentConverter<PaymentAttemptDocument>();
export const paymentEventConverter = createDocumentConverter<PaymentEventDocument>();
  export const paymentReconciliationExceptionConverter = createDocumentConverter<PaymentReconciliationExceptionDocument>();
export const refundConverter = createDocumentConverter<RefundDocument>();
export const commissionConverter = createDocumentConverter<CommissionDocument>();
export const settlementConverter = createDocumentConverter<SettlementDocument>();
export const settlementEntryConverter = createDocumentConverter<SettlementEntryDocument>();
export const shipmentConverter = createDocumentConverter<ShipmentDocument>();
export const reviewConverter = createDocumentConverter<ReviewDocument>();
export const promotionConverter = createDocumentConverter<PromotionDocument>();
export const supportTicketConverter = createDocumentConverter<SupportTicketDocument>();
export const disputeConverter = createDocumentConverter<DisputeDocument>();
export const notificationConverter = createDocumentConverter<NotificationDocument>();
export const auditLogConverter = createDocumentConverter<AuditLogDocument>();
