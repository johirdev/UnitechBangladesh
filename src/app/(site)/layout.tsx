import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { serverGet } from "@/lib/server-api";
import type { Settings, Category } from "@/lib/types";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([serverGet<Settings>("/public/settings", 60), serverGet<Category[]>("/public/categories", 60)]);
  return (
    <>
      <Navbar logo={settings?.logo} phone={settings?.phone} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer s={settings} categories={categories || []} />
    </>
  );
}
