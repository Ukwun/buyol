import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getFirebaseAdminStorage } from "@/lib/firebase/admin";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { getVendorProduct } from "@/features/catalog/server";
import { assertSameOrigin } from "@/lib/security/csrf";

const types = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
export async function POST(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    assertSameOrigin(request); const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const product = await getVendorProduct(user.uid, (await params).productId); const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "An image is required." }, { status: 400 });
    const extension = types.get(file.type); if (!extension || file.size <= 0 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Use a JPEG, PNG or WebP image under 5 MB." }, { status: 400 });
    const storagePath = `products/${product.vendorId}/${product.id}/${randomUUID()}.${extension}`;
    await getFirebaseAdminStorage().bucket().file(storagePath).save(Buffer.from(await file.arrayBuffer()), { metadata: { contentType: file.type } });
    return NextResponse.json({ storagePath });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload image." }, { status: 400 }); }
}
