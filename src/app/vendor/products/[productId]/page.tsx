import { notFound } from "next/navigation";
import { requireCustomerSession } from "@/lib/auth/session";
import { getVendorProduct } from "@/features/catalog/server";
import { getActiveCategories } from "@/features/catalog/storefront";
import { ProductForm } from "@/features/catalog/components";

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const user = await requireCustomerSession();
  let product;
  try { product = await getVendorProduct(user.uid, (await params).productId); } catch { notFound(); }
  const categories = await getActiveCategories();
  return <ProductForm product={product} categories={categories} />;
}
