import { notFound } from "next/navigation";
import { requireCustomerSession } from "@/lib/auth/session";
import { getActiveCategories } from "@/features/catalog/storefront";
import { getUserVendorIds } from "@/features/catalog/server";
import { ProductForm } from "@/features/catalog/components";

export default async function NewProductPage() { const user = await requireCustomerSession(); if (!(await getUserVendorIds(user.uid)).length) notFound(); return <ProductForm categories={await getActiveCategories()} />; }
