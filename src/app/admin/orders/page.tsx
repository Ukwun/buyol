import { EmptyState } from "@/components/feedback";
import { Badge, Card, CardBody } from "@/components/ui";
import { requireAdminSession } from "@/lib/auth/session";
import { listAllOrders } from "@/features/orders/server";
export default async function AdminOrdersPage() { await requireAdminSession(); const orders = await listAllOrders(); return <div><h1>Orders</h1>{!orders.length ? <EmptyState title="No orders" description="Orders will appear here after checkout creation." /> : orders.map((order) => <Card key={order.id}><CardBody><strong>{order.id}</strong><p>Customer: {order.customerId}</p><p>{order.total?.currency} {order.total?.amountMinor}</p><Badge variant="warning">{order.orderStatus ?? "pending_payment"}</Badge></CardBody></Card>)}</div>; }
