import { z } from "zod";
const image = z
  .string()
  .refine(
    (v) =>
      v === "" ||
      (/^\/images\/[a-zA-Z0-9/_-]+\.(webp|avif|png|jpe?g)$/.test(v) &&
        !v.includes("..")),
    "Изображение должно находиться в public/images",
  );
const amount = z
  .string()
  .regex(
    /^\d{1,7}(\.\d{1,2})?$/,
    "Цена: неотрицательная сумма с точностью до копеек",
  );
const link = z.union([
  z.literal(""),
  z.url().refine((v) => v.startsWith("https://")),
]);
export const categorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  sort_order: z.number().int(),
  is_active: z.boolean(),
});
export const productSchema = categorySchema.extend({
  category_id: z.number().int().positive(),
  description: z.string(),
  price: amount,
  weight: z.string(),
  image_url: image,
  is_available: z.boolean(),
});
export const settingsSchema = z.object({
  restaurant_name: z.string().min(1),
  logo_url: image,
  hero_image_url: image,
  hero_title: z.string(),
  description: z.string(),
  contact_phone: z.string(),
  whatsapp: z.string().regex(/^(\d{10,15})?$/),
  address: z.string(),
  maps_url: link,
  working_hours: z.string(),
  delivery_enabled: z.boolean(),
  pickup_enabled: z.boolean(),
  delivery_price: amount.nullable(),
  minimum_order_amount: amount,
  delivery_zone: z.string(),
  scheduled_enabled: z.boolean(),
  social_url: link,
  social_links: z.array(
    z.object({
      name: z.string(),
      url: z.url().refine((v) => v.startsWith("https://")),
    }),
  ),
  seo_title: z.string().min(1),
  seo_description: z.string().min(1),
  site_url: z.url().refine((v) => v.startsWith("https://")),
});
export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type CartLine = { product_id: number; quantity: number };
