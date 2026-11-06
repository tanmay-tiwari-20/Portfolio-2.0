"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";

export default function SiteAnalytics() {
  const pathname = usePathname();
  return pathname?.startsWith("/secret-admin") ? null : <Analytics />;
}
