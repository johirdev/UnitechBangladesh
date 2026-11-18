import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// সার্চ ইঞ্জিন কোন পেজ দেখবে — প্যানেল, রসিদ ও API বাদ
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/teacher", "/receipt", "/api", "/enroll"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
