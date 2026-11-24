import { requireAdminSession } from "@/lib/auth/session";
import { listPaymentAttempts } from "@/features/payments/admin";
import { Badge, Card, CardBody } from "@/components/ui";
import { EmptyState } from "@/components/feedback";
export default async function AdminPaymentsPage() { await requireAdminSession(); const payments = await listPaymentAttempts(); return <div><h1>Payments</h1>{!payments.length ? <EmptyState title="No payment attempts" description="Payment attempts will appear here after customers initialize a configured provider." /> : payments.map((payment) => <Card key={payment.id}><CardBody><strong>{payment.provider}</strong><p>Order: {payment.parentOrderId}</p><p>Reference: {payment.providerReference ?? payment.internalReference}</p><Badge variant={payment.status === "succeeded" ? "success" : payment.status === "failed" ? "danger" : "warning"}>{payment.status}</Badge></CardBody></Card>)}</div>; }
