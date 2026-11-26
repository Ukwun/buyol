import type { Metadata } from "next";
import { connection } from "next/server";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { listAllOrders } from "@/features/orders/server";
import { listPaymentAttempts } from "@/features/payments/admin";

export const metadata: Metadata = { title: "Admin dashboard | BUYLO" };

export default async function AdminPage() {
  await connection();
  const [orders, payments] = await Promise.all([listAllOrders(), listPaymentAttempts()]);
  return <div><Card><CardHeader><div><p>Platform administration</p><h1>BUYLO operations</h1></div><Badge variant="info"><ShieldCheck size={16} aria-hidden="true" /> Admin access</Badge></CardHeader><CardBody><p>This workspace is restricted by trusted Firebase administrator claims. Operational data below is read from the live backend.</p><p><strong>{orders.length}</strong> recent orders · <strong>{payments.length}</strong> recent payment attempts.</p></CardBody></Card><Card><CardBody><h2>Operations</h2><p><Link href="/admin/orders">Review orders <ArrowRight size={16} aria-hidden="true" /></Link></p><p><Link href="/admin/payments">Review payments <ArrowRight size={16} aria-hidden="true" /></Link></p></CardBody></Card></div>;
}
