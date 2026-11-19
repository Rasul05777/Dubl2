export const cents = (v: string | null) => {
  if (v === null) throw new Error("Цена товара пока не указана");
  return Math.round(Number(v) * 100);
};
export const money = (v: string | number | null) =>
  v === null
    ? "Цена уточняется"
    : new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 2,
      }).format(Number(v));
export function cartTotal(
  items: { product: { price: string | null }; quantity: number }[],
) {
  return (
    items.reduce((s, x) => s + cents(x.product.price) * x.quantity, 0) / 100
  );
}
