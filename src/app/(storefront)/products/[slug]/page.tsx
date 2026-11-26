import type { Metadata } from "next";
import { connection } from "next/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { getPublishedProductBySlug } from "@/features/catalog/server";
import { publicProductImages } from "@/features/catalog/media";
import { AddToCartButton } from "@/features/cart/components";
import { ConversationPanel } from "@/features/messaging/components";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Product | BUYOL" };
export const instant = false;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const product = await getPublishedProductBySlug((await params).slug); if (!product) notFound();
  const images = await publicProductImages(product);
  return <article className={styles.page}><div className={styles.gallery}>{images.length ? images.map((image, index) => image.url ? <Image key={image.storagePath ?? image.url} src={image.url} alt={image.alt ?? product.title} width={800} height={800} unoptimized preload={index === 0} /> : null) : <div className={styles.placeholder}>No image</div>}</div><div className={styles.details}><Badge variant="success">Published</Badge><p className={styles.brand}>{product.brand ?? "BUYOL store"}</p><h1>{product.title}</h1><p className={styles.description}>{product.description}</p>{product.variantSummaries.length ? <div className={styles.variants}><h2>Options</h2>{product.variantSummaries.map((variant) => <div key={variant.id}><span>{variant.title}</span><strong>{variant.price.currency} {variant.price.amountMinor}</strong><AddToCartButton listingId={product.id} variantId={variant.id} /></div>)}</div> : <AddToCartButton listingId={product.id} />}<ConversationPanel listingId={product.id} /></div></article>;
}
