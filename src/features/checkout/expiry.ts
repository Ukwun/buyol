import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

/** Trusted scheduled-job entry point. It is intentionally not exposed through a browser route. */
export async function releaseExpiredReservations(now = Timestamp.now()): Promise<number> {
  const db = getFirebaseAdminFirestore(); const snapshot = await db.collectionGroup("reservations").where("status", "==", "active").where("expiresAt", "<=", now).limit(100).get(); let released = 0;
  for (const reservationSnapshot of snapshot.docs) {
    await db.runTransaction(async (transaction) => {
      const reservation = await transaction.get(reservationSnapshot.ref); if (!reservation.exists || reservation.data()?.status !== "active") return;
      const inventoryRef = reservationSnapshot.ref.parent.parent; if (!inventoryRef) return; const inventory = await transaction.get(inventoryRef); if (!inventory.exists) return;
      const data = reservation.data() as { quantity: number; inventoryId: string }; const stock = inventory.data() as { reserved: number; reservationVersion: number }; if (stock.reserved < data.quantity) throw new Error("Inventory reservation state is inconsistent.");
      transaction.update(inventoryRef, { reserved: stock.reserved - data.quantity, reservationVersion: stock.reservationVersion + 1, updatedAt: now }); transaction.update(reservationSnapshot.ref, { status: "expired", releasedAt: now }); transaction.create(inventoryRef.collection("reservationEvents").doc(), { reservationId: reservationSnapshot.id, inventoryId: data.inventoryId, type: "expired", quantity: data.quantity, createdAt: now }); released += 1;
    });
  }
  return released;
}
