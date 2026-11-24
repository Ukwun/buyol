import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { adjustInventory, listInventory } from "@/features/inventory/server";
export async function GET() { const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ inventory: await listInventory(user.uid) }); }
export async function POST(request: Request) { try { assertSameOrigin(request); const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ inventory: await adjustInventory(user.uid, await request.json()) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to adjust inventory." }, { status: 400 }); } }
