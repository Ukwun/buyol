import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { getVendorApplication, saveVendorApplicationDraft, submitVendorApplication } from "@/features/vendors/server";

export async function GET() {
  const user = await getAuthenticatedServerUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ application: await getVendorApplication(user.uid) });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getAuthenticatedServerUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json() as { action?: string; application?: unknown };
    if (body.action === "submit") return NextResponse.json({ application: await submitVendorApplication(user.uid) });
    if (body.action === "draft") return NextResponse.json({ application: await saveVendorApplicationDraft(user.uid, body.application) });
    return NextResponse.json({ error: "Unsupported application action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process the application." }, { status: 400 });
  }
}
