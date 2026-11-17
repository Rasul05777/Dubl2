import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "../../../components/shop";
import { Catalog } from "../../../components/catalog";
import { getProducts, getProduct, getCategories } from "../../../lib/catalog";
export const dynamicParams = false;
export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProduct(slug);
  return {
    title: p?.name,
    description: p?.description,
    alternates: { canonical: `/menu/${slug}/` },
    openGraph: {
      title: p?.name,
      description: p?.description,
      images: p?.image_url ? [p.image_url] : [],
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  return (
    <>
      <Header />
      <main className="section">
        <Link href="/menu/">← Всё меню</Link>
        <h1 style={{ marginTop: 30 }}>{p.name}</h1>
        <Catalog products={[p]} categories={getCategories()} compact />
      </main>
    </>
  );
}
