import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { submitCheckout } from "@/features/checkout/server";
export async function POST(request: Request) { try { assertSameOrigin(request); const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json(await submitCheckout(user.uid, await request.json()), { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create order." }, { status: 400 }); } }
