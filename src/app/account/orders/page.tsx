import { EmptyState } from "@/components/feedback";
import { Badge, Card, CardBody } from "@/components/ui";
import { requireCustomerSession } from "@/lib/auth/session";
import { listCustomerOrders } from "@/features/orders/server";
export default async function AccountOrdersPage() { const user = await requireCustomerSession(); const orders = await listCustomerOrders(user.uid); return <div><h1>Orders</h1>{!orders.length ? <EmptyState title="No orders yet" description="Orders created through checkout will appear here." /> : orders.map((order) => <Card key={order.id}><CardBody><strong>{order.id}</strong><p>{order.total?.currency} {order.total?.amountMinor}</p><Badge variant="warning">{order.orderStatus ?? "pending_payment"}</Badge></CardBody></Card>)}</div>; }
