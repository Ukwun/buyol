import { NextResponse } from "next/server";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { listConfiguredPaymentProviders } from "@/features/payments/server";
export async function GET() { const user = await getAuthenticatedServerUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ providers: await listConfiguredPaymentProviders() }); }
