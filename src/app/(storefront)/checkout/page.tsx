import { requireCustomerSession } from "@/lib/auth/session";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
export default async function CheckoutPage() { await requireCustomerSession(); return <CheckoutForm />; }
