import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { initializePayment } from "@/features/payments/server";
export async function POST(request: Request) { try { assertSameOrigin(request); const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json(await initializePayment(user.uid, await request.json())); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to initialize payment." }, { status: 400 }); } }
