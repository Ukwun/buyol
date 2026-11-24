import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/security/csrf";
import { createVendorProduct, listVendorProducts } from "@/features/catalog/server";

export async function GET(request: Request) {
  const user = await getAuthenticatedServerUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ products: await listVendorProducts(user.uid, new URL(request.url).searchParams.get("q") ?? undefined) });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getAuthenticatedServerUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    return NextResponse.json({ product: await createVendorProduct(user.uid, await request.json()) }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create product." }, { status: 400 }); }
}
