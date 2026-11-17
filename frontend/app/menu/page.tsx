import { Header } from "../../components/shop";
import { Catalog } from "../../components/catalog";
import { getProducts, getCategories } from "../../lib/catalog";
import { getSettings } from "../../lib/settings";
export const metadata = {
  title: "Меню",
  description: "Кофе, выпечка и десерты: меню, цены и заказ через WhatsApp.",
};
export default function Page() {
  return (
    <>
      <Header settings={getSettings()} />
      <main className="section menu-page">
        <p className="eyebrow">ВЫБЕРИТЕ СВОЁ НАСТРОЕНИЕ</p>
        <h1>Наше меню</h1>
        <Catalog products={getProducts()} categories={getCategories()} />
      </main>
    </>
  );
}
