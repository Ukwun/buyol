import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { startConversation } from "@/features/messaging/server";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getAuthenticatedServerUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json() as { listingId?: unknown };
    if (typeof body.listingId !== "string" || !body.listingId) return NextResponse.json({ error: "A product is required." }, { status: 400 });
    return NextResponse.json({ conversation: await startConversation(user.uid, body.listingId) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start conversation." }, { status: 400 });
  }
}
