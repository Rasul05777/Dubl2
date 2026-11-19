import productsData from "../data/products.json";
import categoriesData from "../data/categories.json";
import { categorySchema, productSchema, CartLine, Product } from "./models";
const categories = categorySchema.array().parse(categoriesData);
const products = productSchema.array().parse(productsData);
for (const rows of [categories, products]) {
  if (
    new Set(rows.map((x) => x.id)).size !== rows.length ||
    new Set(rows.map((x) => x.slug)).size !== rows.length
  )
    throw Error("Повторяющийся id или slug в каталоге");
}
if (products.some((p) => !categories.some((c) => c.id === p.category_id)))
  throw Error("Товар ссылается на отсутствующую категорию");
const ordered = <T extends { sort_order: number; id: number }>(rows: T[]) =>
  [...rows].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
export function getCategories() {
  return ordered(categories.filter((c) => c.is_active));
}
export function getProducts() {
  return ordered(
    products.filter(
      (p) => p.is_active && getCategories().some((c) => c.id === p.category_id),
    ),
  );
}
export function getProduct(slug: string) {
  return getProducts().find((p) => p.slug === slug);
}
export function reconcileCart(
  value: unknown,
  catalog: Product[] = getProducts(),
) {
  const items: CartLine[] = [];
  let changed = false;
  if (!Array.isArray(value)) return { items, changed: true };
  for (const row of value) {
    const id = row?.product_id ?? row?.product?.id;
    const p = catalog.find((p) => p.id === id);
    if (
      !p?.is_available ||
      p.price === null ||
      !Number.isInteger(row?.quantity) ||
      row.quantity < 1
    ) {
      changed = true;
      continue;
    }
    const qty = Math.min(99, row.quantity);
    const existing = items.find((x) => x.product_id === id);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + qty);
      changed = true;
    } else items.push({ product_id: id, quantity: qty });
    if (qty !== row.quantity) changed = true;
  }
  return { items, changed };
}
export function resolveCart(lines: CartLine[]) {
  return reconcileCart(lines).items.map((x) => ({
    product: getProducts().find((p) => p.id === x.product_id)!,
    quantity: x.quantity,
  }));
}
