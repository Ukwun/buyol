import "server-only";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { CategoryDocument } from "@/types/firestore";
import { getPublishedProductBySlug, listPublishedProducts } from "./server";

export async function getActiveCategories(): Promise<CategoryDocument[]> {
  const snapshot = await getFirebaseAdminFirestore().collection("categories").where("status", "==", "active").orderBy("sortOrder", "asc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CategoryDocument));
}

export { getPublishedProductBySlug, listPublishedProducts };
