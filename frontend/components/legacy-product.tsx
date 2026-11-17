"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProduct } from "../lib/catalog";
export function LegacyProduct() {
  const router = useRouter();
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("slug");
    if (slug && getProduct(slug)) router.replace(`/menu/${slug}/`);
  }, [router]);
  return null;
}
