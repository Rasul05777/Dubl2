"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header, useCart, Quantity } from "../../components/shop";
import { api, Settings, money } from "../../lib/api";
const schema = z
  .object({
    name: z.string().min(2, "Введите имя"),
    phone: z
      .string()
      .regex(/^\+?[\d ()-]{10,22}$/, "Введите корректный телефон"),
    method: z.enum(["delivery", "pickup"]),
    address: z.string(),
    comment: z.string().max(1000),
    scheduled_at: z.string(),
  })
  .refine((x) => x.method !== "delivery" || x.address.trim().length >= 5, {
    path: ["address"],
    message: "Укажите адрес доставки",
  });
type Form = z.infer<typeof schema>;
export default function Checkout() {
  const { items } = useCart(),
    [settings, setSettings] = useState<Settings>(),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<{
      message: string;
      whatsapp_url: string;
      total: string;
    } | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: "delivery",
      address: "",
      comment: "",
      scheduled_at: "",
    },
  });
  useEffect(() => {
    api<Settings>("/settings")
      .then(setSettings)
      .catch((e) => setError(e.message));
  }, []);
  const method = watch("method");
  useEffect(() => setPreview(null), [items]);
  async function submit(data: Form) {
    setError("");
    setPreview(null);
    try {
      const result = await api<{
        message: string;
        whatsapp_url: string;
        total: string;
      }>("/checkout/preview", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          scheduled_at: data.scheduled_at
            ? new Date(data.scheduled_at).toISOString()
            : "",
          items: items.map((x) => ({
            product_id: x.product.id,
            quantity: x.quantity,
          })),
        }),
      });
      setPreview(result);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Header />
      <main className="section checkout">
        <p className="eyebrow">ЕЩЁ ОДИН ПРИЯТНЫЙ МОМЕНТ</p>
        <h1>Ваш заказ</h1>
        {!items.length ? (
          <p>
            Корзина пуста. <Link href="/menu">Перейти в меню →</Link>
          </p>
        ) : (
          <div className="checkout-grid">
            <form
              onSubmit={handleSubmit(submit)}
              onChange={() => setPreview(null)}
            >
              <h3>Контактные данные</h3>
              <label>
                Ваше имя
                <input {...register("name")} autoComplete="given-name" />
                {errors.name && (
                  <small className="error">{errors.name.message}</small>
                )}
              </label>
              <label>
                Телефон
                <input
                  {...register("phone")}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+7 ___ ___-__-__"
                />
                {errors.phone && (
                  <small className="error">{errors.phone.message}</small>
                )}
              </label>
              <label>
                Как вам удобно?
                <select {...register("method")}>
                  <option
                    value="delivery"
                    disabled={settings && !settings.delivery_enabled}
                  >
                    Доставка
                  </option>
                  <option
                    value="pickup"
                    disabled={settings && !settings.pickup_enabled}
                  >
                    Самовывоз
                  </option>
                </select>
              </label>
              {method === "delivery" && (
                <label>
                  Адрес доставки
                  <input
                    {...register("address")}
                    autoComplete="street-address"
                  />
                  {errors.address && (
                    <small className="error">{errors.address.message}</small>
                  )}
                </label>
              )}
              {settings?.scheduled_enabled && (
                <label>
                  Ко времени (или оставьте пустым)
                  <input type="datetime-local" {...register("scheduled_at")} />
                </label>
              )}
              <label>
                Комментарий
                <textarea
                  {...register("comment")}
                  placeholder="Что нам нужно знать о вашем заказе?"
                />
              </label>
              <p className="muted">
                Контактные данные нужны для обработки заказа и будут включены в
                сообщение WhatsApp.
              </p>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <button className="button" disabled={isSubmitting}>
                {isSubmitting ? "Проверяем…" : "Проверить заказ"}
              </button>
              {preview && (
                <div className="preview">
                  <h3>Заказ проверен · {money(preview.total)}</h3>
                  <pre>{preview.message}</pre>
                  <a
                    className="button"
                    href={preview.whatsapp_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Перейти в WhatsApp →
                  </a>
                  <p className="muted">
                    Самостоятельно отправьте сообщение в WhatsApp. Заказ будет
                    принят только после подтверждения заведением.
                  </p>
                </div>
              )}
            </form>
            <aside>
              <h3>Вы выбрали</h3>
              {items.map((x) => (
                <div className="cart-row" key={x.product.id}>
                  <div>
                    <b>{x.product.name}</b>
                    <p>{money(x.product.price)}</p>
                  </div>
                  <Quantity product={x.product} quantity={x.quantity} />
                </div>
              ))}
              <div className="total">
                <span>Товары</span>
                <b>
                  {money(
                    items.reduce(
                      (s, x) => s + Number(x.product.price) * x.quantity,
                      0,
                    ),
                  )}
                </b>
              </div>
              <p className="muted">
                {method === "pickup"
                  ? "Самовывоз бесплатно"
                  : settings?.delivery_price != null
                    ? `Доставка: ${money(settings.delivery_price)}`
                    : "Доставка не включена, стоимость уточнит менеджер"}
                . Окончательный расчёт — после проверки заказа.
              </p>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
