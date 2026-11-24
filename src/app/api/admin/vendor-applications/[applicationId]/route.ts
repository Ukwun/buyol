import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/permissions";
import { reviewVendorApplication } from "@/features/vendors/server";
import { assertSameOrigin } from "@/lib/security/csrf";

export async function PATCH(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await getAuthenticatedServerUser();
    if (!user || !(await isPlatformAdmin(user.uid))) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    const { applicationId } = await params;
    await reviewVendorApplication(user.uid, applicationId, await request.json());
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to review application." }, { status: 400 });
  }
}
