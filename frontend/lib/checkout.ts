import { z } from "zod";
import { getSettings } from "./settings";
import { reconcileCart, resolveCart } from "./catalog";
import { CartLine, Settings } from "./models";
import { cents, money } from "./format";
export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, "Введите имя").max(100),
    method: z.enum(["delivery", "pickup"]),
    address: z.string().trim().max(500),
    comment: z.string().trim().max(1000),
    scheduled_at: z.string(),
  })
  .refine((x) => x.method !== "delivery" || x.address.length >= 5, {
    path: ["address"],
    message: "Укажите адрес доставки",
  });
export type CheckoutForm = z.infer<typeof checkoutSchema>;
export function buildOrder(
  input: CheckoutForm,
  lines: CartLine[],
  settings: Settings = getSettings(),
) {
  const data = checkoutSchema.parse(input);
  if (!lines.length) throw Error("Корзина пуста");
  const checked = reconcileCart(lines);
  if (checked.changed || checked.items.length !== lines.length)
    throw Error("Состав корзины изменился. Проверьте товары.");
  if (
    !settings[
      data.method === "delivery" ? "delivery_enabled" : "pickup_enabled"
    ]
  )
    throw Error("Этот способ получения недоступен");
  if (!/^\d{10,15}$/.test(settings.whatsapp))
    throw Error(
      "Номер WhatsApp ещё не указан. Свяжитесь с заведением по контактам на сайте.",
    );
  if (
    data.scheduled_at &&
    (!settings.scheduled_enabled ||
      !Number.isFinite(Date.parse(data.scheduled_at)) ||
      Date.parse(data.scheduled_at) <= Date.now())
  )
    throw Error("Укажите доступное будущее время получения");
  const items = resolveCart(lines);
  const subtotal = items.reduce(
    (s, x) => s + cents(x.product.price) * x.quantity,
    0,
  );
  if (subtotal < cents(settings.minimum_order_amount))
    throw Error(
      `Минимальная сумма заказа: ${money(settings.minimum_order_amount)}`,
    );
  const fee =
    data.method === "pickup"
      ? 0
      : settings.delivery_price === null
        ? null
        : cents(settings.delivery_price);
  const total = (subtotal + (fee ?? 0)) / 100;
  const message = [
    `Здравствуйте! Хочу оформить заказ в «${settings.restaurant_name}».`,
    "",
    ...items.map(
      (x) =>
        `${x.product.name} — ${x.quantity} шт. × ${money(x.product.price)} = ${money((cents(x.product.price) * x.quantity) / 100)}`,
    ),
    "",
    `Стоимость товаров: ${money(subtotal / 100)}`,
    `Доставка: ${fee === null ? "стоимость уточнит сотрудник" : money(fee / 100)}`,
    `Предварительная сумма: ${money(total)}${fee === null ? " + доставка" : ""}`,
    `Получение: ${data.method === "delivery" ? "доставка" : "самовывоз"}`,
    data.method === "delivery"
      ? `Адрес доставки: ${data.address}`
      : `Адрес самовывоза: ${settings.address || "уточнить у сотрудника"}`,
    `Имя: ${data.name}`,
    `Время: ${data.scheduled_at || "как можно скорее"}`,
    `Комментарий: ${data.comment || "нет"}`,
    "",
    "Цены, наличие и итоговая стоимость требуют подтверждения сотрудником.",
  ].join("\n");
  return {
    message,
    total,
    whatsapp_url: `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`,
  };
}
