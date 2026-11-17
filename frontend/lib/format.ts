export const cents = (v: string) => Math.round(Number(v) * 100);
export const money = (v: string | number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(Number(v));
export function cartTotal(
  items: { product: { price: string }; quantity: number }[],
) {
  return (
    items.reduce((s, x) => s + cents(x.product.price) * x.quantity, 0) / 100
  );
}
