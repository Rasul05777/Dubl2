export const dynamic = "force-static";
import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/menu"].map((p) => ({
    url: (process.env.SITE_URL || "http://localhost:8080") + p,
  }));
}
