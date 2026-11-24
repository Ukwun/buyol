import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { archiveVendorProduct, getVendorProduct, submitVendorProduct, updateVendorProduct } from "@/features/catalog/server";

type Params = { params: Promise<{ productId: string }> };
export async function GET(_request: Request, { params }: Params) {
  const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { return NextResponse.json({ product: await getVendorProduct(user.uid, (await params).productId) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Product not found." }, { status: 404 }); }
}
export async function PATCH(request: Request, { params }: Params) {
  try { assertSameOrigin(request); const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const productId = (await params).productId; const body = await request.json() as { action?: string; product?: unknown }; if (body.action === "submit") await submitVendorProduct(user.uid, productId); else if (body.action === "archive") await archiveVendorProduct(user.uid, productId); else await updateVendorProduct(user.uid, productId, body.product); return NextResponse.json({ success: true }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update product." }, { status: 400 }); }
}
