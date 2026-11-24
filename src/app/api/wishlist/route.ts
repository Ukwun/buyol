import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { addWishlistItem, getWishlist, removeWishlistItem } from "@/features/wishlist/server";
export async function GET() { const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ items: await getWishlist(user.uid) }); }
export async function POST(request: Request) { try { assertSameOrigin(request); const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const body = await request.json() as { listingId?: string; action?: string }; if (!body.listingId) throw new Error("A listing is required."); if (body.action === "remove") await removeWishlistItem(user.uid, body.listingId); else await addWishlistItem(user.uid, body.listingId); return NextResponse.json({ success: true }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update wishlist." }, { status: 400 }); } }
