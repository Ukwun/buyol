import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { getAuthenticatedServerUser } from "@/lib/auth/session";
import { listCustomerOrders } from "@/features/orders/server";

export const metadata: Metadata = { title: "Customer account | BUYOL" };

export default async function AccountPage() {
  const currentUser = await getAuthenticatedServerUser();
  const orders = currentUser ? await listCustomerOrders(currentUser.uid) : [];
  return <div><Card><CardHeader><div><p>Customer account</p><h1>Welcome back, {currentUser?.user.displayName || currentUser?.user.email}.</h1></div><Badge variant="success">Verified account</Badge></CardHeader><CardBody><p>Your account is connected to your authenticated BUYOL identity. Order, cart and vendor access are evaluated server-side for this account.</p><p><strong>{orders.length}</strong> order{orders.length === 1 ? "" : "s"} in your history.</p><Link href="/account/orders">View your orders <ArrowRight size={16} aria-hidden="true" /></Link></CardBody></Card><Card><CardBody><div><ShoppingBag size={22} aria-hidden="true" /><h2>Continue shopping</h2><p>Browse published listings from eligible BUYOL stores.</p><Link href="/">Explore the marketplace <ArrowRight size={16} aria-hidden="true" /></Link></div></CardBody></Card></div>;
}
