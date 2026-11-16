"use client";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { api, mediaUrl } from "../../lib/api";
type RecordData = Record<string, string | number | boolean | null>;
const labels: Record<string, string> = {
  name: "Название",
  slug: "Адрес (латиницей)",
  sort_order: "Порядок",
  is_active: "Показывать на сайте",
  category_id: "Категория",
  description: "Описание",
  price: "Цена, ₽",
  weight: "Вес / объём",
  image_url: "Фото товара",
  is_available: "Есть в наличии",
  restaurant_name: "Название заведения",
  logo_url: "Логотип",
  hero_image_url: "Фото первого экрана",
  hero_title: "Заголовок первого экрана",
  contact_phone: "Телефон",
  whatsapp: "WhatsApp (только цифры)",
  address: "Адрес",
  maps_url: "Ссылка Яндекс Карты",
  working_hours: "Режим работы",
  delivery_enabled: "Доставка работает",
  pickup_enabled: "Самовывоз работает",
  delivery_price: "Доставка, ₽ (пусто — уточнит менеджер)",
  minimum_order_amount: "Минимальный заказ, ₽",
  delivery_zone: "Зона и условия доставки",
  scheduled_enabled: "Разрешить заказы ко времени",
  social_url: "Социальная сеть",
  seo_title: "SEO заголовок",
  seo_description: "SEO описание",
};
const category = { name: "", slug: "", sort_order: 0, is_active: true };
const product = {
  ...category,
  category_id: 0,
  description: "",
  price: "0",
  weight: "",
  image_url: "",
  is_available: true,
};
export default function Admin() {
  const [auth, setAuth] = useState(false),
    [checking, setChecking] = useState(true),
    [section, setSection] = useState("products"),
    [rows, setRows] = useState<RecordData[]>([]),
    [cats, setCats] = useState<RecordData[]>([]),
    [edit, setEdit] = useState<RecordData | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api("/admin/me")
      .then(() => setAuth(true))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  async function load() {
    setError("");
    try {
      const [data, categories] = await Promise.all([
        api<RecordData[] | RecordData>("/admin/" + section),
        api<RecordData[]>("/admin/categories"),
      ]);
      setCats(categories);
      if (section === "settings") {
        setEdit(data as RecordData);
        setRows([]);
      } else {
        setRows(data as RecordData[]);
        setEdit(null);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (auth) void load();
  }, [auth, section]);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/admin/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(d)),
      });
      setAuth(true);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const d = { ...edit };
      delete d.id;
      if (section === "settings" && d.delivery_price === "")
        d.delivery_price = null;
      await api(
        "/admin/" +
          section +
          (section !== "settings" && edit.id ? "/" + edit.id : ""),
        {
          method: section === "settings" || edit.id ? "PATCH" : "POST",
          body: JSON.stringify(d),
        },
      );
      await load();
      setNotice("Изменения сохранены");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(key: string, file: File) {
    const d = new FormData();
    d.append("file", file);
    setBusy(true);
    try {
      const r = await api<{ url: string }>("/admin/uploads", {
        method: "POST",
        body: d,
      });
      setEdit((old) => ({ ...old, [key]: r.url }));
      setNotice("Фото загружено. Сохраните изменения.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin section">
      <div className="section-heading">
        <Link className="brand" href="/">
          Дубль II
        </Link>
        {auth && (
          <button
            onClick={async () => {
              await api("/admin/logout", { method: "POST" });
              setAuth(false);
            }}
          >
            Выйти
          </button>
        )}
      </div>
      <h1>Управление сайтом</h1>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {checking ? (
        <p>Проверяем доступ…</p>
      ) : !auth ? (
        <form className="login" onSubmit={login}>
          <label>
            Логин
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Пароль
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="button" disabled={busy}>
            Войти
          </button>
        </form>
      ) : (
        <>
          <div className="tabs">
            {[
              ["products", "Товары"],
              ["categories", "Категории"],
              ["settings", "Настройки сайта"],
            ].map(([key, title]) => (
              <button
                className={key === section ? "active" : ""}
                key={key}
                onClick={() => {
                  setSection(key);
                  setNotice("");
                }}
              >
                {title}
              </button>
            ))}
          </div>
          {section !== "settings" && (
            <button
              className="button"
              onClick={() =>
                setEdit(
                  section === "products"
                    ? { ...product, category_id: cats[0]?.id || 0 }
                    : { ...category },
                )
              }
            >
              Добавить {section === "products" ? "товар" : "категорию"}
            </button>
          )}
          <div className="admin-grid">
            <div>
              {rows.map((row) => (
                <div className="admin-row" key={String(row.id)}>
                  <button onClick={() => setEdit(row)}>
                    <b>{row.name}</b>
                    <small>
                      {row.is_active ? "Опубликовано" : "Скрыто"}{" "}
                      {row.price ? `· ${row.price} ₽` : ""}
                    </small>
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Удалить «" + row.name + "»?")) return;
                      try {
                        await api("/admin/" + section + "/" + row.id, {
                          method: "DELETE",
                        });
                        await load();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
            {edit && (
              <form className="editor" onSubmit={save}>
                <h3>
                  {section === "settings"
                    ? "Настройки сайта"
                    : edit.id
                      ? "Редактировать"
                      : "Новая запись"}
                </h3>
                {Object.entries(edit)
                  .filter(([key]) => key !== "id")
                  .map(([key, value]) => (
                    <label key={key}>
                      {labels[key] || key}
                      {typeof value === "boolean" ? (
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setEdit({ ...edit, [key]: e.target.checked })
                          }
                        />
                      ) : key === "category_id" ? (
                        <select
                          value={String(value)}
                          onChange={(e) =>
                            setEdit({ ...edit, [key]: Number(e.target.value) })
                          }
                        >
                          {cats.map((c) => (
                            <option value={Number(c.id)} key={String(c.id)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <input
                            value={value == null ? "" : String(value)}
                            type={
                              [
                                "price",
                                "sort_order",
                                "delivery_price",
                                "minimum_order_amount",
                              ].includes(key)
                                ? "number"
                                : "text"
                            }
                            step="any"
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                [key]:
                                  key === "sort_order"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              })
                            }
                          />
                          {key.endsWith("_url") &&
                            !["maps_url", "social_url"].includes(key) && (
                              <>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => {
                                    if (e.target.files?.[0])
                                      void upload(key, e.target.files[0]);
                                  }}
                                />
                                {value && (
                                  <img
                                    className="admin-preview"
                                    src={mediaUrl(String(value))}
                                    alt="Предпросмотр"
                                  />
                                )}
                              </>
                            )}
                        </>
                      )}
                    </label>
                  ))}
                <button className="button" disabled={busy}>
                  {busy ? "Сохраняем…" : "Сохранить"}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </main>
  );
}
