export const dynamic = "force-static";
import { getSettings } from "../lib/settings";
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout/", "/admin/"] },
    sitemap: new URL("/sitemap.xml", getSettings().site_url).href,
  };
}
