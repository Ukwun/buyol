import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security/csrf";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", sessionCookieOptions(0));
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sign out." },
      { status: 403 },
    );
  }
}
