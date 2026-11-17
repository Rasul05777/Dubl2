"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import Link from "next/link";
import { ShoppingBag, Plus, Minus, X, ArrowRight, Menu } from "lucide-react";
import { Product, Settings, CartLine } from "../lib/models";
import { money, cartTotal } from "../lib/format";
import { getProducts, reconcileCart, resolveCart } from "../lib/catalog";
import { getSettings } from "../lib/settings";
type Entry = { product: Product; quantity: number };
const Cart = createContext<{
  items: Entry[];
  change: (p: Product, d: number) => void;
  clear: () => void;
  open: () => void;
}>({ items: [], change: () => {}, clear: () => {}, open: () => {} });
export const useCart = () => useContext(Cart);
export function ShopProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]),
    [ready, setReady] = useState(false),
    [shown, setShown] = useState(false),
    [notice, setNotice] = useState("");
  const items = useMemo(() => resolveCart(lines), [lines]);
  function restore() {
    try {
      const result = reconcileCart(
        JSON.parse(localStorage.getItem("dubl-cart") || "[]"),
      );
      setLines(result.items);
      if (result.changed)
        setNotice(
          "Некоторые товары удалены из корзины: они больше недоступны. Цены обновлены по текущему меню.",
        );
    } catch {
      setLines([]);
      setNotice(
        "Не удалось прочитать сохранённую корзину. Добавьте товары заново.",
      );
    }
    setReady(true);
  }
  useEffect(() => {
    restore();
    window.addEventListener("storage", restore);
    return () => window.removeEventListener("storage", restore);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("dubl-cart", JSON.stringify(lines));
      } catch {
        setNotice(
          "Браузер не разрешает сохранять корзину. Она доступна до обновления страницы.",
        );
      }
  }, [lines, ready]);
  function open() {
    const result = reconcileCart(lines);
    setLines(result.items);
    if (result.changed) setNotice("Недоступные товары удалены из корзины.");
    setShown(true);
  }
  const change = (product: Product, d: number) =>
    setLines((old) => {
      if (!getProducts().some((p) => p.id === product.id && p.is_available))
        return old;
      const entry = old.find((x) => x.product_id === product.id);
      return entry
        ? old
            .map((x) =>
              x.product_id === product.id
                ? { ...x, quantity: Math.min(99, x.quantity + d) }
                : x,
            )
            .filter((x) => x.quantity > 0)
        : d > 0
          ? [...old, { product_id: product.id, quantity: 1 }]
          : old;
    });
  const count = items.reduce((n, x) => n + x.quantity, 0);
  return (
    <Cart.Provider
      value={{
        items,
        change,
        clear: () => setLines([]),
        open,
      }}
    >
      {children}
      {notice && (
        <p className="section muted" role="status">
          {notice}
        </p>
      )}
      {count > 0 && (
        <button className="mobile-cart" onClick={open}>
          <ShoppingBag size={19} /> Корзина · {count}
          <span>{money(cartTotal(items))}</span>
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
                  Товары <b>{money(cartTotal(items))}</b>
                </div>
                <p className="muted">
                  Сумма предварительная. Цены и наличие подтвердит сотрудник
                  заведения.
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
export function Header({ settings = getSettings() }: { settings?: Settings }) {
  const { items, open } = useCart(),
    [menu, setMenu] = useState(false);
  return (
    <header>
      <Link className="brand" href="/">
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt={settings.restaurant_name} />
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
