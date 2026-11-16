"use client";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Truck, Coffee } from "lucide-react";
import { Header } from "../components/shop";
import { Catalog } from "../components/catalog";
import { PublicData } from "../components/public-data";
import { publicData, money, mediaUrl } from "../lib/api";
export default function Home() {
  return <PublicData>{(data) => <HomeContent data={data} />}</PublicData>;
}
function HomeContent({
  data,
}: {
  data: Awaited<ReturnType<typeof publicData>>;
}) {
  const { settings: s, categories, products } = data;
  return (
    <>
      <Header settings={s} />
      <main>
        <section
          className="hero"
          style={
            s.hero_image_url
              ? {
                  backgroundImage: `linear-gradient(90deg,rgba(23,14,10,.94),rgba(23,14,10,.05)),url("${mediaUrl(s.hero_image_url)}")`,
                }
              : {}
          }
        >
          <div className="hero-copy">
            <p className="eyebrow">
              ГАСТРОБАР «{s.restaurant_name.toUpperCase()}»
            </p>
            <h1>
              {s.hero_title.includes(" и ") ? (
                <>
                  {s.hero_title.split(" и ")[0]}
                  <br />и{" "}
                  <em>{s.hero_title.split(" и ").slice(1).join(" и ")}</em>
                </>
              ) : (
                s.hero_title
              )}
            </h1>
            <p className="hero-description">
              Маленькая пауза. Большое удовольствие.
            </p>
            <Link className="button" href="/menu">
              Смотреть меню <ArrowRight size={21} />
            </Link>
            <span className="hero-note">С любовью к каждому моменту</span>
          </div>
          {!s.hero_image_url && (
            <div className="hero-art">
              <Coffee strokeWidth={0.7} />
              <span>время для себя</span>
            </div>
          )}
        </section>
        <section className="section category-section">
          <div className="section-heading">
            <h2>Наше меню</h2>
            <Link href="/menu">
              Смотреть всё меню <ArrowRight />
            </Link>
          </div>
          <div className="categories">
            {categories.map((c) => {
              const p = products.find(
                (p) => p.category_id === c.id && p.image_url,
              );
              return (
                <Link
                  href={`/menu?category=${c.slug}`}
                  key={c.id}
                  className="category-card"
                >
                  {(p || s.hero_image_url) && (
                    <img
                      src={mediaUrl(p?.image_url || s.hero_image_url)}
                      alt={c.name}
                      loading="lazy"
                    />
                  )}
                  <div>
                    <h3>{c.name}</h3>
                    <ArrowRight />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ВАШИ БУДУЩИЕ ЛЮБИМЧИКИ</p>
              <h2>Повод заглянуть</h2>
            </div>
            <span className="muted">Вкусно с первого знакомства</span>
          </div>
          <Catalog products={products} categories={categories} compact />
        </section>
        <section id="about" className="section about">
          <div>
            <p className="eyebrow">ЧУТЬ БОЛЬШЕ, ЧЕМ ГАСТРОБАР</p>
            <h2>
              У хороших моментов
              <br />
              есть <em>второй дубль.</em>
            </h2>
          </div>
          <div>
            <p>{s.description}</p>
            <Link className="text-link" href="/menu">
              Найдите свой любимый вкус <ArrowRight />
            </Link>
          </div>
        </section>
        <section className="section delivery">
          <p className="eyebrow">ТАМ, ГДЕ ВАМ УЮТНО</p>
          <h2>Любимое — с собой</h2>
          <div className="info-grid">
            <div>
              <Truck />
              <h3>Доставка</h3>
              <p>
                {s.delivery_enabled
                  ? s.delivery_zone
                  : "Доставка пока недоступна."}
              </p>
              <small>
                {s.delivery_enabled &&
                  (s.delivery_price === null
                    ? "Стоимость уточнит менеджер"
                    : `Доставка ${money(s.delivery_price)}`)}
              </small>
            </div>
            <div>
              <ShoppingIcon />
              <h3>Самовывоз</h3>
              <p>
                {s.pickup_enabled
                  ? "Выберите любимые блюда, а мы подготовим их к вашему приходу."
                  : "Самовывоз пока недоступен."}
              </p>
            </div>
            <div>
              <Clock />
              <h3>Время для встречи</h3>
              <p>{s.working_hours}</p>
              <small>Минимальный заказ: {money(s.minimum_order_amount)}</small>
            </div>
          </div>
        </section>
        <section id="contacts" className="section contacts">
          <div>
            <p className="eyebrow">ДО ВСТРЕЧИ В «ДУБЛЕ»</p>
            <h2>Заходите на огонёк</h2>
            <p>
              <MapPin size={18} /> {s.address || "Адрес скоро появится"}
            </p>
            {s.contact_phone && (
              <a className="phone" href={`tel:${s.contact_phone}`}>
                {s.contact_phone}
              </a>
            )}
            <p>{s.working_hours}</p>
          </div>
          {s.maps_url && (
            <a
              className="button outline"
              href={s.maps_url}
              target="_blank"
              rel="noreferrer"
            >
              Открыть Яндекс Карты <ArrowRight />
            </a>
          )}
        </section>
      </main>
      <footer>
        <span>
          © {new Date().getFullYear()} {s.restaurant_name}
        </span>
        <Link href="/menu">Меню</Link>
        <span>Сделано для тёплых встреч</span>
      </footer>
    </>
  );
}
function ShoppingIcon() {
  return <Coffee />;
}
