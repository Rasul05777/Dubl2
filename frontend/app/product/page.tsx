"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "../../components/shop";
import { Catalog } from "../../components/catalog";
import { PublicData } from "../../components/public-data";
function ProductContent() {
  const params = useSearchParams();
  return (
    <PublicData>
      {(d) => {
        const p = d.products.find((p) => p.slug === params.get("slug"));
        return (
          <>
            <Header settings={d.settings} />
            <main className="section">
              <Link href="/menu/">← Всё меню</Link>
              {p ? (
                <>
                  <h1 style={{ marginTop: 30 }}>{p.name}</h1>
                  <Catalog products={[p]} categories={d.categories} compact />
                </>
              ) : (
                <h1>Товар не найден</h1>
              )}
            </main>
          </>
        );
      }}
    </PublicData>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p className="section">Загружаем товар…</p>}>
      <ProductContent />
    </Suspense>
  );
}
