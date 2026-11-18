"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** প্রতিটি পেজ ভিজিট রেকর্ড করে (অ্যাডমিন অ্যানালিটিক্সের জন্য) */
export default function Tracker() {
  const pathname = usePathname() ?? "";
  const last = useRef("");

  useEffect(() => {
    if (!pathname || pathname === last.current || pathname.startsWith("/admin")) return;
    last.current = pathname;
    let vid = "";
    try {
      vid = localStorage.getItem("utb_vid") || "";
      if (!vid) {
        vid = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("utb_vid", vid);
      }
    } catch {}
    const m = pathname.match(/^\/courses\/([^/]+)$/);
    fetch("/api/v1/public/track", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "utb-web" },
      body: JSON.stringify({
        path: pathname,
        visitorId: vid.replace(/[^\w-]/g, "").slice(0, 64),
        referrer: document.referrer && !document.referrer.includes(location.host) ? document.referrer.slice(0, 300) : "",
        courseSlug: m ? decodeURIComponent(m[1]) : undefined,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
