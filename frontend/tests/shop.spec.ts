import { test, expect } from "@playwright/test";
import { getProducts } from "../lib/catalog";
import { getSettings } from "../lib/settings";
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("request", (r) => {
    expect(r.url()).not.toMatch(/:8000|\/api\/|twcstorage|\/uploads\//);
  });
  page.on("close", () => expect(errors).toEqual([]));
});
test("home and catalog render without JavaScript and have static SEO", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL + "/");
  await expect(page.locator("h1")).toContainText("Кофе");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    getSettings().seo_title,
  );
  await page.goto(baseURL + "/menu/");
  await expect(
    page.getByRole("heading", { name: "Капучино", exact: true }),
  ).toBeVisible();
  await page.goto(baseURL + "/menu/cappuccino/");
  await expect(page.locator("h1")).toHaveText("Капучино");
  await context.close();
});
test("category switching, photos, cart quantities and reload", async ({
  page,
}) => {
  await page.goto("/menu/");
  await page.getByRole("button", { name: "Выпечка", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Капучино", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Всё меню", exact: true }).click();
  await expect
    .poll(() =>
      page
        .getByAltText("Капучино", { exact: true })
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "В корзину: Капучино", exact: true })
    .click();
  await page.locator(".cart-button").click();
  let cart = page.getByRole("dialog");
  await cart
    .getByRole("button", { name: "Добавить Капучино", exact: true })
    .click();
  await expect(cart.locator(".quantity span")).toHaveText("2");
  await page.reload();
  await page.locator(".cart-button").click();
  cart = page.getByRole("dialog");
  await expect(cart.locator(".quantity span")).toHaveText("2");
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dubl-cart")!),
  );
  expect(stored).toEqual([{ product_id: 1, quantity: 2 }]);
  await cart
    .getByRole("button", { name: "Уменьшить Капучино", exact: true })
    .click();
  await cart
    .getByRole("button", { name: "Уменьшить Капучино", exact: true })
    .click();
  await expect(
    cart.getByText("Пока здесь пусто.", { exact: false }),
  ).toBeVisible();
});
test("legacy cart refreshes prices and removes unavailable identifiers", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "dubl-cart",
      JSON.stringify([
        { product: { id: 1, price: "1", name: "Old price" }, quantity: 1 },
        { product_id: 999999, quantity: 2 },
      ]),
    ),
  );
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("больше недоступны");
  await page.locator(".cart-button").click();
  const cart = page.getByRole("dialog");
  await expect(cart.getByText("Капучино", { exact: true })).toBeVisible();
  await expect(cart.getByText("280", { exact: false }).first()).toBeVisible();
});
test("delivery and pickup forms validate without backend", async ({ page }) => {
  await page.goto("/menu/?category=coffee");
  await page
    .getByRole("button", { name: "В корзину: Капучино", exact: true })
    .click();
  await page.goto("/checkout/");
  await page
    .getByRole("button", { name: "Оформить заказ", exact: true })
    .click();
  await expect(page.getByText("Введите имя", { exact: true })).toBeVisible();
  await page.getByLabel("Ваше имя").fill("Анна");
  await page.getByLabel("Телефон", { exact: true }).fill("+79991234567");
  await expect(page.getByLabel("Адрес доставки")).toBeVisible();
  await page.getByLabel("Адрес доставки").fill("Пушкина, дом 1");
  await page.getByLabel("Как вам удобно?").selectOption("pickup");
  await expect(page.getByLabel("Адрес доставки")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Оформить заказ", exact: true })
    .click();
  if (!getSettings().whatsapp)
    await expect(page.getByRole("alert").filter({hasText:"Номер WhatsApp"})).toContainText(
      "Номер WhatsApp ещё не указан",
    );
});
test("all internal routes open directly; admin absent; mobile layout fits", async ({
  page,
  request,
}) => {
  for (const path of [
    "/",
    "/menu/",
    "/checkout/",
    ...getProducts().map((p) => `/menu/${p.slug}/`),
  ]) {
    const r = await page.goto(path);
    expect(r?.status()).toBe(200);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
  expect((await request.get("/admin/")).status()).toBe(404);
});
