import type { Metadata } from "next";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui";
import { requireCustomerSession } from "@/lib/auth/session";
import { getVendorApplication } from "@/features/vendors/server";
import { VendorApplicationForm } from "@/features/vendors/components";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Vendor onboarding | BUYOL" };

export default async function VendorPage() {
  const user = await requireCustomerSession();
  const application = await getVendorApplication(user.uid);
  if (application?.status === "approved") {
    return <div className={styles.page}><div className={styles.heading}><p className={styles.eyebrow}>Vendor workspace</p><h1>Manage your store</h1><p>Your store is approved. Store management tools will be introduced in the next marketplace stage.</p></div><Card><CardHeader><div className={styles.cardHeading}><h2>{application.store.name}</h2><Badge variant="success">Approved</Badge></div></CardHeader><CardBody><div className={styles.overview}><div><span>Store slug</span><strong>{application.store.slug}</strong></div><div><span>Operating country</span><strong>{application.store.countryCode}</strong></div><div><span>Settlement currency</span><strong>{application.store.settlementCurrency}</strong></div></div></CardBody></Card></div>;
  }
  return <div className={styles.page}><div className={styles.heading}><p className={styles.eyebrow}>Vendor onboarding</p><h1>Build your BUYOL store</h1><p>Submit your business and store details for review. Approval is handled by an authorized BUYOL administrator.</p></div>{application?.status === "suspended" ? <Card><CardBody><Badge variant="danger">Suspended</Badge><p>Your vendor access is currently suspended. Contact BUYOL support for next steps.</p></CardBody></Card> : <VendorApplicationForm email={user.email ?? user.user.email} existing={application ?? undefined} />}</div>;
}
