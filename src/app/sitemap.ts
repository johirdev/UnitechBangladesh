import type { MetadataRoute } from "next";
import { serverGet } from "@/lib/server-api";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

// Google এর জন্য সাইটের সব পাবলিক পেজ ও প্রতিটি কোর্সের লিংক
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/courses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/gallery`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/unitech-architectural`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/verify-certificate`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/guide`, changeFrequency: "monthly", priority: 0.4 },
  ];
  const courses = (await serverGet<{ slug: string; updatedAt?: string }[]>("/public/courses?limit=60", 3600)) || [];
  return [
    ...pages,
    ...courses.map((c) => ({
      url: `${siteUrl}/courses/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
