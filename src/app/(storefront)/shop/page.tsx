import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { EmptyState } from "@/components/feedback";
import { getActiveCategories, listPublishedProducts } from "@/features/catalog/storefront";
import { publicProductImages } from "@/features/catalog/media";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "BUYOL | Global marketplace" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  await connection();
  const [products, categories] = await Promise.all([listPublishedProducts(params.q, params.category), getActiveCategories()]);
  const productsWithImages = await Promise.all(products.map(async (product) => ({ product, images: await publicProductImages(product) })));
  return <div className={styles.page}><section className={styles.hero}><p className={styles.eyebrow}>BUYOL marketplace</p><h1>Discover products with a world of possibility.</h1><p>Explore independent stores and carefully reviewed products from across the marketplace.</p></section><form className={styles.filters} method="get"><label className={styles.search}>Search<input name="q" defaultValue={params.q} placeholder="Search products" /></label><label>Category<select name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><button type="submit">Search</button></form>{productsWithImages.length === 0 ? <div className={styles.empty}><EmptyState title="No products are available yet" description="Try another search or check back soon as BUYOL stores launch." /></div> : <div className={styles.grid}>{productsWithImages.map(({ product, images }) => { const price = product.sellingPrice ?? product.variantSummaries[0]?.price; return <Link className={styles.product} href={`/products/${product.slug}`} key={product.id}><div className={styles.image}>{images[0]?.url ? <Image src={images[0].url} alt={images[0].alt ?? product.title} width={640} height={480} unoptimized /> : <span>No image</span>}</div><div className={styles.productBody}><h2>{product.title}</h2><p>{product.shortDescription ?? product.description}</p><p>{price?.currency ?? ""} {price?.amountMinor ?? ""}</p></div></Link>; })}</div>}</div>;
}
