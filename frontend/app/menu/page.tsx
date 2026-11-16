"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "../../components/shop";
import { Catalog } from "../../components/catalog";
import { PublicData } from "../../components/public-data";
function MenuContent() {
  const params = useSearchParams();
  return (
    <PublicData>
      {(d) => (
        <>
          <Header settings={d.settings} />
          <main className="section menu-page">
            <p className="eyebrow">ВЫБЕРИТЕ СВОЁ НАСТРОЕНИЕ</p>
            <h1>Наше меню</h1>
            <Catalog
              key={params.get("category") || "all"}
              {...d}
              initialCategory={
                d.categories.find((c) => c.slug === params.get("category"))
                  ?.id || 0
              }
            />
          </main>
        </>
      )}
    </PublicData>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p className="section">Загружаем меню…</p>}>
      <MenuContent />
    </Suspense>
  );
}
