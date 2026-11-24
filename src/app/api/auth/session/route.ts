import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { sessionRequestSchema } from "@/features/auth/schemas";
import { assertSameOrigin } from "@/lib/security/csrf";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS, sessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = sessionRequestSchema.parse(await request.json());
    const decoded = await getFirebaseAdminAuth().verifyIdToken(body.idToken, true);

    if (decoded.email_verified !== true) {
      return NextResponse.json({ error: "Email verification is required." }, { status: 403 });
    }

    const sessionCookie = await getFirebaseAdminAuth().createSessionCookie(body.idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, sessionCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create a session.";
    const status = message.includes("Cross-site") ? 403 : 401;
    return NextResponse.json({ error: status === 403 ? message : "Unable to create a session." }, { status });
  }
}
