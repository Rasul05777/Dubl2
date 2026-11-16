import { test, expect } from "@playwright/test";
test("cart persists and checkout validates customer details", async ({
  page,
}) => {
  await page.goto("/menu");
  await expect(page.getByRole("heading", { name: "Наше меню" })).toBeVisible();
  await page
    .getByRole("button", { name: "В корзину: Капучино", exact: true })
    .click();
  await page.reload();
  await page.locator(".cart-button").click();
  const cart = page.getByRole("dialog", { name: "Корзина" });
  await expect(cart.getByText("Капучино", { exact: true })).toBeVisible();
  await cart.getByRole("link", { name: "Оформить заказ" }).click();
  await page.getByRole("button", { name: "Проверить заказ" }).click();
  await expect(page.getByText("Введите имя", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Введите корректный телефон", { exact: true }),
  ).toBeVisible();
});
test("admin requires login", async ({ page }) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("button", { name: "Войти", exact: true }),
  ).toBeVisible();
  const r = await page.request.get(
    (process.env.E2E_API_URL || "http://localhost:8000") +
      "/api/admin/products",
  );
  expect(r.status()).toBe(401);
});

test("admin changes and new product work without rebuilding static frontend", async ({
  page,
}, testInfo) => {
  const api = process.env.E2E_API_URL || "http://localhost:8000";
  const origin = process.env.E2E_BASE_URL || "http://localhost:8080";
  await page.goto("/admin/");
  await page
    .getByLabel("Логин", { exact: true })
    .fill(process.env.E2E_ADMIN_USERNAME || "admin");
  await page
    .getByLabel("Пароль", { exact: true })
    .fill(process.env.E2E_ADMIN_PASSWORD || "test-password-123");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Выйти", exact: true }),
  ).toBeVisible();
  const categories = await (
    await page.request.get(api + "/api/admin/categories")
  ).json();
  const slug = `static-test-${testInfo.project.name}-${Date.now()}`;
  const product = {
    name: "Тест экспорта " + slug,
    slug,
    category_id: categories[0].id,
    price: "123.45",
    description: "Товар создан после статической сборки",
    weight: "1 шт.",
    image_url: "",
    is_available: true,
    is_active: true,
    sort_order: 999,
  };
  const headers = { Origin: origin };
  const upload = await page.request.post(api + "/api/admin/uploads", {
    headers,
    multipart: {
      file: {
        name: "test.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=",
          "base64",
        ),
      },
    },
  });
  expect(upload.ok()).toBeTruthy();
  const image = (await upload.json()).url;
  product.image_url = image;
  const created = await page.request.post(api + "/api/admin/products", {
    headers,
    data: product,
  });
  expect(created.ok()).toBeTruthy();
  const row = await created.json();
  try {
    await page.goto("/product/?slug=" + slug);
    await expect(
      page.getByRole("heading", { level: 1, name: product.name }),
    ).toBeVisible();
    await expect(page.getByAltText(product.name)).toBeVisible();
    await expect
      .poll(() =>
        page
          .getByAltText(product.name)
          .evaluate((img: HTMLImageElement) => img.naturalWidth),
      )
      .toBeGreaterThan(0);
    await page
      .getByRole("button", { name: "В корзину: " + product.name, exact: true })
      .click();
    await page.goto("/checkout/");
    await page.getByLabel("Ваше имя").fill("Тестовый покупатель");
    await page.getByLabel("Телефон", { exact: true }).fill("+79991234567");
    await page.getByLabel("Как вам удобно?").selectOption("pickup");
    const current = await (
      await page.request.get(api + "/api/admin/settings")
    ).json();
    expect(
      (
        await page.request.patch(api + "/api/admin/settings", {
          headers,
          data: { ...current, whatsapp: "79991234567" },
        })
      ).ok(),
    ).toBeTruthy();
    await page
      .getByRole("button", { name: "Проверить заказ", exact: true })
      .click();
    const link = page.getByRole("link", { name: "Перейти в WhatsApp" });
    await expect(link).toHaveAttribute(
      "href",
      /^https:\/\/wa.me\/79991234567\?text=/,
    );
    await expect(
      page.getByText("Самостоятельно отправьте сообщение", { exact: false }),
    ).toBeVisible();
  } finally {
    expect(
      (
        await page.request.delete(api + "/api/admin/products/" + row.id, {
          headers,
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await page.request.delete(
          api + "/api/admin/uploads/" + image.split("/").pop(),
          { headers },
        )
      ).ok(),
    ).toBeTruthy();
  }
});
