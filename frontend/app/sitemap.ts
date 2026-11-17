export const dynamic = "force-static";
import { getProducts } from "../lib/catalog";
import { getSettings } from "../lib/settings";
export default function sitemap() {
  return ["/", "/menu/", ...getProducts().map((p) => `/menu/${p.slug}/`)].map(
    (path) => ({ url: new URL(path, getSettings().site_url).href }),
  );
}
