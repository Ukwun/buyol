import { NextResponse } from "next/server";
import { processPaymentWebhook } from "@/features/payments/server";
export async function POST(request: Request) { try { return NextResponse.json(await processPaymentWebhook("paystack", await request.text(), request.headers)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook rejected." }, { status: 400 }); } }
