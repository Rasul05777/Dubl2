"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Plus, Search } from "lucide-react";
import { Category, Product, money } from "../lib/api";
import { mediaUrl } from "../lib/api";
import { Quantity, useCart } from "./shop";
export function Catalog({
  products,
  categories,
  compact = false,
  initialCategory = 0,
}: {
  products: Product[];
  categories: Category[];
  compact?: boolean;
  initialCategory?: number;
}) {
  const [category, setCategory] = useState(initialCategory),
    [search, setSearch] = useState("");
  const { items, change } = useCart();
  const visible = products.filter(
    (p) =>
      (!category || p.category_id === category) &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      {!compact && (
        <>
          <label className="search">
            <Search size={19} />
            <input
              aria-label="Поиск по меню"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Найти любимое…"
            />
          </label>
          <div className="tabs">
            <button
              className={!category ? "active" : ""}
              onClick={() => setCategory(0)}
            >
              Всё меню
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={category === c.id ? "active" : ""}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="products">
        {(compact ? visible.slice(0, 4) : visible).map((p, i) => (
          <motion.article
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 4) * 0.05 }}
            className="product"
            key={p.id}
          >
            <div className="product-image">
              {p.image_url ? (
                <img src={mediaUrl(p.image_url)} alt={p.name} loading="lazy" />
              ) : (
                <div className="image-placeholder">
                  Дубль <i>II</i>
                </div>
              )}
              {!p.is_available && <span className="badge">Скоро вернётся</span>}
            </div>
            <div className="product-body">
              <span className="weight">{p.weight}</span>
              <h3>
                <Link href={`/product/?slug=${encodeURIComponent(p.slug)}`}>
                  {p.name}
                </Link>
              </h3>
              <p>{p.description}</p>
              <div className="product-bottom">
                <b>{money(p.price)}</b>
                {items.find((x) => x.product.id === p.id) ? (
                  <Quantity
                    product={p}
                    quantity={
                      items.find((x) => x.product.id === p.id)!.quantity
                    }
                  />
                ) : (
                  <button
                    aria-label={"В корзину: " + p.name}
                    disabled={!p.is_available}
                    className="add"
                    onClick={() => change(p, 1)}
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
      {!visible.length && (
        <p className="empty">
          Ничего не найдено. Попробуйте другую категорию или запрос.
        </p>
      )}
    </>
  );
}
