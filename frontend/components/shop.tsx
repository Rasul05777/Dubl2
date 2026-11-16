"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import Link from "next/link";
import { ShoppingBag, Plus, Minus, X, ArrowRight, Menu } from "lucide-react";
import { Product, Settings, money, mediaUrl } from "../lib/api";
type Entry = { product: Product; quantity: number };
const Cart = createContext<{
  items: Entry[];
  change: (p: Product, d: number) => void;
  clear: () => void;
  open: () => void;
}>({ items: [], change: () => {}, clear: () => {}, open: () => {} });
export const useCart = () => useContext(Cart);
export function ShopProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Entry[]>([]),
    [ready, setReady] = useState(false),
    [shown, setShown] = useState(false);
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("dubl-cart") || "[]");
      if (Array.isArray(d))
        setItems(
          d.filter(
            (x) =>
              x?.product?.id &&
              Number.isInteger(x.quantity) &&
              x.quantity > 0 &&
              x.quantity <= 99,
          ),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("dubl-cart", JSON.stringify(items));
  }, [items, ready]);
  const change = (product: Product, d: number) =>
    setItems((old) => {
      const entry = old.find((x) => x.product.id === product.id);
      return entry
        ? old
            .map((x) =>
              x.product.id === product.id
                ? { product, quantity: Math.min(99, x.quantity + d) }
                : x,
            )
            .filter((x) => x.quantity > 0)
        : d > 0
          ? [...old, { product, quantity: 1 }]
          : old;
    });
  const count = items.reduce((n, x) => n + x.quantity, 0);
  return (
    <Cart.Provider
      value={{
        items,
        change,
        clear: () => setItems([]),
        open: () => setShown(true),
      }}
    >
      {children}
      {count > 0 && (
        <button className="mobile-cart" onClick={() => setShown(true)}>
          <ShoppingBag size={19} /> Корзина · {count}
          <span>
            {money(
              items.reduce(
                (s, x) => s + Number(x.product.price) * x.quantity,
                0,
              ),
            )}
          </span>
        </button>
      )}
      {shown && (
        <div className="overlay" onClick={() => setShown(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Корзина"
            className="drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Закрыть корзину"
              className="close"
              onClick={() => setShown(false)}
            >
              <X />
            </button>
            <p className="eyebrow">ВАШ ЗАКАЗ</p>
            <h2>Корзина</h2>
            {items.length === 0 ? (
              <p>Пока здесь пусто. Выберите что-нибудь вкусное в меню.</p>
            ) : (
              <>
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
                  Товары{" "}
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
                  Стоимость и наличие проверим перед переходом в WhatsApp.
                </p>
                <Link
                  className="button"
                  href="/checkout"
                  onClick={() => setShown(false)}
                >
                  Оформить заказ <ArrowRight size={19} />
                </Link>
              </>
            )}
          </section>
        </div>
      )}
    </Cart.Provider>
  );
}
export function Quantity({
  product,
  quantity,
}: {
  product: Product;
  quantity: number;
}) {
  const { change } = useCart();
  return (
    <div className="quantity">
      <button
        aria-label={"Уменьшить " + product.name}
        onClick={() => change(product, -1)}
      >
        <Minus size={16} />
      </button>
      <span>{quantity}</span>
      <button
        aria-label={"Добавить " + product.name}
        onClick={() => change(product, 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
export function Header({ settings }: { settings?: Settings }) {
  const { items, open } = useCart(),
    [menu, setMenu] = useState(false);
  return (
    <header>
      <Link className="brand" href="/">
        {settings?.logo_url ? (
          <img
            src={mediaUrl(settings.logo_url)}
            alt={settings.restaurant_name}
          />
        ) : (
          <>
            <span>
              Дубль <i>II</i>
            </span>
            <small>ГАСТРОБАР</small>
          </>
        )}
      </Link>
      <nav className={menu ? "expanded" : ""}>
        <Link onClick={() => setMenu(false)} href="/">
          Главная
        </Link>
        <Link onClick={() => setMenu(false)} href="/menu">
          Меню
        </Link>
        <Link onClick={() => setMenu(false)} href="/#about">
          О нас
        </Link>
        <Link onClick={() => setMenu(false)} href="/#contacts">
          Контакты
        </Link>
      </nav>
      <button className="cart-button" onClick={open}>
        <ShoppingBag size={20} />
        <span>Корзина</span>
        <b>{items.reduce((s, x) => s + x.quantity, 0)}</b>
      </button>
      <button
        aria-label="Навигация"
        className="hamburger"
        onClick={() => setMenu(!menu)}
      >
        <Menu />
      </button>
    </header>
  );
}
