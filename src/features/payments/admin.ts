import "server-only";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { PaymentAttemptDocument } from "@/types/firestore";
export async function listPaymentAttempts(): Promise<PaymentAttemptDocument[]> { const snapshot = await getFirebaseAdminFirestore().collection("payments").orderBy("createdAt", "desc").limit(100).get(); return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PaymentAttemptDocument)); }
