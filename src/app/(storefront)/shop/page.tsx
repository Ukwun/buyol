import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Headphones, PackageOpen, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { EmptyState } from "@/components/feedback";
import { getActiveCategories, listPublishedProducts } from "@/features/catalog/storefront";
import { publicProductImages } from "@/features/catalog/media";
import { HomeHero } from "@/features/storefront/components";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "BUYOL | Global marketplace" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  await connection();
  const [products, categories] = await Promise.all([listPublishedProducts(params.q, params.category), getActiveCategories()]).catch(() => [[], []] as const);
  const productsWithImages = await Promise.all(products.map(async (product) => ({ product, images: await publicProductImages(product) })));

  return <div className={styles.page}>
    <HomeHero />
    <section className={styles.promiseRow} aria-label="BUYOL customer promises">
      <div><Truck size={22} aria-hidden="true" /><span><strong>Delivery, your way</strong><small>From local stores to global finds</small></span></div>
      <div><ShieldCheck size={22} aria-hidden="true" /><span><strong>Secure by design</strong><small>Trusted payments and real sellers</small></span></div>
      <div><Undo2 size={22} aria-hidden="true" /><span><strong>Easy returns</strong><small>Clear policies before you buy</small></span></div>
      <div><Headphones size={22} aria-hidden="true" /><span><strong>Human support</strong><small>Help when you need it</small></span></div>
    </section>
    <section className={styles.section} aria-labelledby="categories-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Browse the marketplace</p><h2 id="categories-title">Find your next favourite.</h2></div>{categories.length ? <Link href="#catalog" className={styles.textLink}>View all <ArrowRight size={16} aria-hidden="true" /></Link> : null}</div>
      {categories.length ? <div className={styles.categoryGrid}>{categories.slice(0, 8).map((category, index) => <Link className={`${styles.category} ${styles[`category${index % 4}`]}`} href={`/shop?category=${encodeURIComponent(category.id)}`} key={category.id}><span>{category.name.slice(0, 1)}</span><strong>{category.name}</strong><small>Explore now <ArrowRight size={14} aria-hidden="true" /></small></Link>)}</div> : <EmptyState title="Categories are coming soon" description="Published products will appear here as BUYOL stores launch." />}
    </section>
    <section className={styles.section} id="catalog" aria-labelledby="catalog-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Real listings from BUYOL stores</p><h2 id="catalog-title">Made to be discovered.</h2></div></div>
      <form className={styles.filters} method="get"><label className={styles.search}>Search<input name="q" defaultValue={params.q} placeholder="Search products, brands and stores" /></label><label>Category<select name="category" defaultValue={params.category ?? ""}><option value="">All categories</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><button type="submit">Search</button></form>
      {productsWithImages.length === 0 ? <div className={styles.empty}><EmptyState title="No products are available yet" description="Try another search or check back soon as BUYOL stores launch." /></div> : <div className={styles.grid}>{productsWithImages.map(({ product, images }) => { const price = product.sellingPrice ?? product.variantSummaries[0]?.price; return <Link className={styles.product} href={`/products/${product.slug}`} key={product.id}><div className={styles.image}>{images[0]?.url ? <Image src={images[0].url} alt={images[0].alt ?? product.title} width={640} height={480} sizes="(max-width: 36rem) 100vw, (max-width: 64rem) 50vw, 25vw" unoptimized /> : <div className={styles.imagePlaceholder}><PackageOpen size={34} aria-hidden="true" /><span>Product image coming soon</span></div>}</div><div className={styles.productBody}><span className={styles.productTag}>{product.brand ?? "BUYOL store"}</span><h3>{product.title}</h3><p>{product.shortDescription ?? product.description}</p><strong>{price?.currency ?? ""} {price?.amountMinor ?? ""}</strong></div></Link>; })}</div>}
    </section>
  </div>;
}
