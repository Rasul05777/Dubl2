export type Category = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};
export type Product = Category & {
  category_id: number;
  description: string;
  price: string;
  weight: string;
  image_url: string;
  is_available: boolean;
};
export type Settings = {
  restaurant_name: string;
  logo_url: string;
  hero_image_url: string;
  hero_title: string;
  description: string;
  contact_phone: string;
  whatsapp: string;
  address: string;
  maps_url: string;
  working_hours: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_price: string | null;
  minimum_order_amount: string;
  delivery_zone: string;
  scheduled_enabled: boolean;
  social_url: string;
  seo_title: string;
  seo_description: string;
};
// Public build-time configuration; no secrets may be stored here.
export const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
export function mediaUrl(value: string): string {
  if (value.startsWith("/uploads/")) return API_ORIGIN + value;
  return value;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const r = await fetch(API_ORIGIN + "/api" + path, {
    credentials: "include",
    ...options,
    headers:
      options.body instanceof FormData
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });
  if (!r.ok) {
    let d;
    try {
      d = await r.json();
    } catch {}
    throw new Error(
      typeof d?.detail === "string"
        ? d.detail
        : "Проверьте данные или попробуйте позже",
    );
  }
  return r.json();
}
export async function publicData() {
  const [categories, products, settings] = await Promise.all([
    api<Category[]>("/categories"),
    api<Product[]>("/products"),
    api<Settings>("/settings"),
  ]);
  return {
    categories: categories as Category[],
    products: products as Product[],
    settings: settings as Settings,
  };
}
export const money = (v: number | string) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(Number(v));
