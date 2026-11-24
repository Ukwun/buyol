import "server-only";

import type { ProductImage, VendorListingDocument } from "@/types/firestore";
import { getFirebaseAdminStorage } from "@/lib/firebase/admin";

export async function publicProductImages(product: VendorListingDocument): Promise<ProductImage[]> {
  const bucket = getFirebaseAdminStorage().bucket();
  return Promise.all(product.images.map(async (image) => {
    if (!image.storagePath) return image;
    const [url] = await bucket.file(image.storagePath).getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
    return { ...image, url };
  }));
}
