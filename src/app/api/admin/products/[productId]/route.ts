import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/permissions";
import { moderateVendorProduct } from "@/features/catalog/server";
import { assertSameOrigin } from "@/lib/security/csrf";

export async function PATCH(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try { assertSameOrigin(request); const user = await getAuthenticatedServerUser(); if (!user || !(await isPlatformAdmin(user.uid))) return NextResponse.json({ error: "Administrator access required." }, { status: 403 }); const body = await request.json() as { decision: "published" | "rejected" | "unpublished"; rejectionReason?: string }; await moderateVendorProduct(user.uid, (await params).productId, body.decision, body.rejectionReason); return NextResponse.json({ success: true }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to moderate product." }, { status: 400 }); }
}
