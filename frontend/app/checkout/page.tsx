"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header, useCart, Quantity } from "../../components/shop";
import { getSettings } from "../../lib/settings";
import { money, cartTotal } from "../../lib/format";
import { checkoutSchema as schema, buildOrder } from "../../lib/checkout";
type Form = z.infer<typeof schema>;
export default function Checkout() {
  const { items } = useCart(),
    [settings] = useState(getSettings),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<{
      message: string;
      whatsapp_url: string;
      total: number;
    } | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: settings.delivery_enabled ? "delivery" : "pickup",
      address: "",
      comment: "",
      scheduled_at: "",
    },
  });
  const method = watch("method");
  useEffect(() => setPreview(null), [items]);
  async function submit(data: Form) {
    setError("");
    setPreview(null);
    try {
      const result = buildOrder(
        data,
        items.map((x) => ({ product_id: x.product.id, quantity: x.quantity })),
      );
      setPreview(result);
      window.open(result.whatsapp_url, "_blank", "noopener,noreferrer");
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
                <input
                  aria-label="Ваше имя"
                  {...register("name")}
                  autoComplete="given-name"
                />
                {errors.name && (
                  <small className="error">{errors.name.message}</small>
                )}
              </label>
              <label>
                Телефон
                <input
                  aria-label="Телефон"
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
                    aria-label="Адрес доставки"
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
                Сумма заказа предварительная. Контактные данные будут включены в
                сообщение WhatsApp.
              </p>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <button className="button" disabled={isSubmitting}>
                {isSubmitting ? "Готовим…" : "Оформить заказ"}
              </button>
              {preview && (
                <div className="preview">
                  <h3>Предварительная сумма · {money(preview.total)}</h3>
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
                <b>{money(cartTotal(items))}</b>
              </div>
              <p className="muted">
                {method === "pickup"
                  ? "Самовывоз бесплатно"
                  : settings?.delivery_price != null
                    ? `Доставка: ${money(settings.delivery_price)}`
                    : "Доставка не включена, стоимость уточнит менеджер"}
                . Итоговую стоимость и наличие подтвердит сотрудник заведения.
              </p>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
