import type { Metadata } from "next";
import { ShopProvider } from "../components/shop";
import "./globals.css";
import { getSettings } from "../lib/settings";
const s = getSettings();
export const metadata: Metadata = {
  metadataBase: new URL(s.site_url),
  title: { default: s.seo_title, template: `%s — ${s.restaurant_name}` },
  description: s.seo_description,
  openGraph: {
    title: s.seo_title,
    description: s.seo_description,
    locale: "ru_RU",
    type: "website",
    images: s.hero_image_url ? [s.hero_image_url] : [],
  },
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
