import Link from "next/link";
import { Plus } from "lucide-react";
import { Alert, EmptyState } from "@/components/feedback";
import { Badge, Button } from "@/components/ui";
import { requireCustomerSession } from "@/lib/auth/session";
import { getUserVendorIds, listVendorProducts } from "@/features/catalog/server";
import styles from "./page.module.css";

export default async function VendorProductsPage() {
  const user = await requireCustomerSession(); const vendorIds = await getUserVendorIds(user.uid); const products = vendorIds.length ? await listVendorProducts(user.uid) : [];
  return <div className={styles.page}><div className={styles.heading}><div><h1>Products</h1><p>Manage drafts and submit catalogue listings for review.</p></div>{vendorIds.length ? <Link href="/vendor/products/new"><Button startIcon={<Plus size={18} aria-hidden="true" />}>New product</Button></Link> : null}</div>{!vendorIds.length ? <Alert variant="info" title="Catalogue access is not active">Your vendor application must be approved before you can manage products.</Alert> : products.length === 0 ? <EmptyState title="No products yet" description="Create your first product draft when your store is approved." /> : <div className={styles.list}>{products.map((product) => <div className={styles.row} key={product.id}><div><h2>{product.title}</h2><p>{product.slug}</p></div><Badge variant={product.publicationStatus === "published" ? "success" : product.publicationStatus === "rejected" ? "danger" : "warning"}>{product.publicationStatus}</Badge><Link className={styles.link} href={`/vendor/products/${product.id}`}>Edit</Link></div>)}</div>}</div>;
}
