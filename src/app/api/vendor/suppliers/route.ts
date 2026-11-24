import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { importSupplierProduct, listConfiguredSuppliers } from "@/features/suppliers/server";
import { getUserVendorIds } from "@/features/catalog/server";

export async function GET() { const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ suppliers: await listConfiguredSuppliers() }); }
export async function POST(request: Request) { try { assertSameOrigin(request); const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); const body = await request.json() as { supplierId?: string; externalProductId?: string }; const vendorId = (await getUserVendorIds(user.uid))[0]; if (!vendorId || !body.supplierId || !body.externalProductId) return NextResponse.json({ error: "Supplier and external product reference are required." }, { status: 400 }); return NextResponse.json(await importSupplierProduct(user.uid, vendorId, body.supplierId, body.externalProductId), { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Supplier import unavailable." }, { status: 400 }); } }
