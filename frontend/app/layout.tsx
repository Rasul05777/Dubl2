import type { Metadata } from "next";
import { ShopProvider } from "../components/shop";
import "./globals.css";
export const metadata: Metadata = {
  title: "Дубль второй — гастробар",
  description: "Кофе, свежая выпечка и десерты. Заказ на доставку и самовывоз.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ShopProvider>{children}</ShopProvider>
      </body>
    </html>
  );
}
