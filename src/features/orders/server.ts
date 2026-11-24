import "server-only";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getUserVendorIds } from "@/features/catalog/server";
import type { ParentOrderDocument, VendorOrderDocument } from "@/types/firestore";
export async function listCustomerOrders(customerId: string): Promise<ParentOrderDocument[]> { const snapshot = await getFirebaseAdminFirestore().collection("orders").where("customerId", "==", customerId).orderBy("createdAt", "desc").limit(50).get(); return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ParentOrderDocument)); }
export async function listVendorOrders(userId: string): Promise<VendorOrderDocument[]> { const vendorIds = await getUserVendorIds(userId); const snapshots = await Promise.all(vendorIds.map((vendorId) => getFirebaseAdminFirestore().collection("vendorOrders").where("vendorId", "==", vendorId).orderBy("createdAt", "desc").limit(50).get())); return snapshots.flatMap((result) => result.docs.map((doc) => ({ id: doc.id, ...doc.data() } as VendorOrderDocument))); }
export async function listAllOrders(): Promise<ParentOrderDocument[]> { const snapshot = await getFirebaseAdminFirestore().collection("orders").orderBy("createdAt", "desc").limit(100).get(); return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ParentOrderDocument)); }
