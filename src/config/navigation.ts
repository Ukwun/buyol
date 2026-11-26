export interface NavigationItem {
  label: string;
  href: string;
  description?: string;
}

export const navigation = {
  storefront: [
    { label: "Home", href: "/" },
    { label: "Sign in", href: "/sign-in" },
  ],
  account: [
    { label: "Overview", href: "/account" },
    { label: "Orders", href: "/account/orders" },
    { label: "Messages", href: "/account/messages" },
  ],
  vendor: [
    { label: "Overview", href: "/vendor" },
    { label: "Products", href: "/vendor/products" },
    { label: "Inventory", href: "/vendor/inventory" },
    { label: "Orders", href: "/vendor/orders" },
    { label: "Messages", href: "/vendor/messages" },
  ],
  admin: [
    { label: "Overview", href: "/admin" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Payments", href: "/admin/payments" },
  ],
} satisfies Record<"storefront" | "account" | "vendor" | "admin", NavigationItem[]>;
