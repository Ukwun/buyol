import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getFirebaseAdminStorage } from "@/lib/firebase/admin";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { getVendorApplication } from "@/features/vendors/server";
import { assertSameOrigin } from "@/lib/security/csrf";

const allowedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getAuthenticatedServerUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const application = await getVendorApplication(user.uid);
    if (!application || !["draft", "rejected"].includes(application.status)) return NextResponse.json({ error: "Save a draft before uploading store branding." }, { status: 400 });
    const formData = await request.formData();
    const kind = formData.get("kind");
    const file = formData.get("file");
    if ((kind !== "logo" && kind !== "banner") || !(file instanceof File)) return NextResponse.json({ error: "A logo or banner image is required." }, { status: 400 });
    const extension = allowedTypes.get(file.type);
    if (!extension || file.size <= 0 || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Use a JPEG, PNG or WebP image under 5 MB." }, { status: 400 });
    const path = `vendorApplications/${user.uid}/branding/${kind}-${randomUUID()}.${extension}`;
    await getFirebaseAdminStorage().bucket().file(path).save(Buffer.from(await file.arrayBuffer()), { metadata: { contentType: file.type } });
    return NextResponse.json({ path });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload image." }, { status: 400 });
  }
}
