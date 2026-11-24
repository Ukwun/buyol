import { EmptyState } from "@/components/feedback";
import { Badge, Card, CardBody } from "@/components/ui";
import { requireCustomerSession } from "@/lib/auth/session";
import { listVendorOrders } from "@/features/orders/server";
export default async function VendorOrdersPage() { const user = await requireCustomerSession(); const orders = await listVendorOrders(user.uid); return <div><h1>Vendor orders</h1>{!orders.length ? <EmptyState title="No vendor orders" description="Orders containing your products will appear here." /> : orders.map((order) => <Card key={order.id}><CardBody><strong>{order.id}</strong><p>{order.total?.currency} {order.total?.amountMinor}</p><Badge variant="warning">{order.orderStatus ?? "pending_payment"}</Badge><p>Payment status: {order.paymentStatus}</p></CardBody></Card>)}</div>; }
