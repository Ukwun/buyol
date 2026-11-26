import { requireCustomerSession } from "@/lib/auth/session";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
export const instant = false;

export default async function CheckoutPage() { await requireCustomerSession(); return <CheckoutForm />; }
