import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { serverGet } from "@/lib/server-api";
import type { GalleryItem, Topper } from "@/lib/types";
import GalleryGrid from "@/components/site/GalleryGrid";
import { Empty, Avatar } from "@/components/ui";

export const metadata: Metadata = { title: "গ্যালারি", description: "কোর্স চলাকালীন শিক্ষার্থীদের নিয়ে কিছু মুহূর্ত ও সেমিস্টার টপার।" };

export default async function GalleryPage() {
  const [items, toppers] = await Promise.all([serverGet<GalleryItem[]>("/public/gallery", 60), serverGet<Topper[]>("/public/toppers", 60)]);
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container py-14 text-center">
          <span className="eyebrow">গ্যালারি</span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">কোর্স চলাকালীন কিছু মুহূর্ত</h1>
        </div>
      </section>
      <section className="container pb-16">{items?.length ? <GalleryGrid items={items} variant="grid" /> : <Empty title="এখনো কোনো ছবি নেই" />}</section>
      {!!toppers?.length && (
        <section className="bg-gray-50 py-16">
          <div className="container">
            <h2 className="h2 flex items-center gap-2">
              <Trophy className="h-8 w-8 text-brand" /> সেমিস্টার টপার
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {toppers.map((t) => (
                <div key={t._id} className="card overflow-hidden">
                  <div className="aspect-[4/5] bg-brand-50">
                    {t.image || t.student?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.image || t.student.avatar} alt={t.student?.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Avatar name={t.student?.name} size={110} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{t.student?.name}</p>
                    <p className="text-sm text-brand-700">
                      {t.course?.title} {t.batch?.name && `• ${t.batch.name}`}
                    </p>
                    {t.project && <p className="mt-1 text-xs text-ink-muted">প্রজেক্ট: {t.project}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
