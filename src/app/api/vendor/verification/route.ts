import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { submitVendorVerification } from "@/features/vendors/server";
import { assertSameOrigin } from "@/lib/security/csrf";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getAuthenticatedServerUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    return NextResponse.json({ verification: await submitVendorVerification(user.uid, await request.json()) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit verification." }, { status: 400 });
  }
}
