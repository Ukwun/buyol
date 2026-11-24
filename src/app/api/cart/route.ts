import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { clearCart, getCart, upsertCartItem } from "@/features/cart/server";
export async function GET() { const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json(await getCart(user.uid)); }
export async function POST(request: Request) { try { assertSameOrigin(request); const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const body = await request.json() as { action?: string; item?: unknown }; if (body.action === "clear") await clearCart(user.uid); else await upsertCartItem(user.uid, body.item); return NextResponse.json({ success: true }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update cart." }, { status: 400 }); } }
