import Link from "next/link";
import { Header } from "../../components/shop";
import { getProducts } from "../../lib/catalog";
import { LegacyProduct } from "../../components/legacy-product";
export const metadata = {
  title: "Товары",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <>
      <Header />
      <LegacyProduct />
      <main className="section">
        <h1>Наши товары</h1>
        {getProducts().map((p) => (
          <p key={p.id}>
            <Link href={`/menu/${p.slug}/`}>{p.name}</Link>
          </p>
        ))}
      </main>
    </>
  );
}
