import { test, expect } from "@playwright/test";
import { buildOrder, CheckoutForm } from "../lib/checkout";
import { getSettings } from "../lib/settings";
import { reconcileCart, getProducts } from "../lib/catalog";
const data: CheckoutForm = {
  name: "Анна",
  phone: "+79991234567",
  method: "delivery",
  address: "Пушкина 1",
  comment: "Без сахара & спасибо",
  scheduled_at: "",
};
const settings = {
  ...getSettings(),
  whatsapp: "79991234567",
  delivery_price: "100.50",
  minimum_order_amount: "0.00",
};
test("WhatsApp uses catalog prices, encoded text and preliminary delivery total", () => {
  const order = buildOrder(data, [{ product_id: 1, quantity: 2 }], settings);
  expect(order.total).toBe(660.5);
  const url = new URL(order.whatsapp_url);
  expect(url.hostname).toBe("wa.me");
  expect(url.pathname).toBe("/79991234567");
  expect(url.searchParams.get("text")).toBe(order.message);
  expect(order.message).toContain("Капучино — 2 шт.");
  expect(order.message).toContain("Предварительная сумма");
  expect(order.message).toContain(data.comment);
  expect(order.message).toContain(settings.restaurant_name);
});
test("pickup excludes fee, unknown delivery stays outside total", () => {
  expect(
    buildOrder(
      { ...data, method: "pickup" },
      [{ product_id: 1, quantity: 1 }],
      settings,
    ).total,
  ).toBe(280);
  const order = buildOrder(data, [{ product_id: 1, quantity: 1 }], {
    ...settings,
    delivery_price: null,
  });
  expect(order.total).toBe(280);
  expect(order.message).toContain("+ доставка");
});
test("minimum, disabled method, invalid phone and missing WhatsApp are rejected", () => {
  expect(() =>
    buildOrder(data, [{ product_id: 1, quantity: 1 }], {
      ...settings,
      minimum_order_amount: "1000",
    }),
  ).toThrow("Минимальная");
  expect(() =>
    buildOrder(data, [{ product_id: 1, quantity: 1 }], {
      ...settings,
      delivery_enabled: false,
    }),
  ).toThrow("недоступен");
  expect(() =>
    buildOrder(
      { ...data, phone: "x" },
      [{ product_id: 1, quantity: 1 }],
      settings,
    ),
  ).toThrow();
  expect(() =>
    buildOrder(data, [{ product_id: 1, quantity: 1 }], {
      ...settings,
      whatsapp: "",
    }),
  ).toThrow("WhatsApp");
});
test("cart validates identifiers, quantities and merges duplicates", () => {
  expect(
    reconcileCart([
      { product_id: 1, quantity: 2 },
      { product_id: 1, quantity: 3 },
      { product_id: 999999, quantity: 1 },
    ]),
  ).toEqual({ items: [{ product_id: 1, quantity: 5 }], changed: true });
  expect(reconcileCart([{ product_id: 1, quantity: -1 }]).items).toEqual([]);
});

test("unavailable products are removed from saved cart", () => {
  expect(
    reconcileCart(
      [{ product_id: 1, quantity: 2 }],
      getProducts().map((p) => ({ ...p, is_available: false })),
    ),
  ).toEqual({ items: [], changed: true });
});
