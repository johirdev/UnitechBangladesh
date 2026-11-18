import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { serverGet } from "@/lib/server-api";
import type { Category, Course } from "@/lib/types";
import CourseCard from "@/components/site/CourseCard";
import { Empty } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "সকল কোর্স", description: "Unitech Bangladesh এর সকল স্কিল কোর্স — AutoCAD, Web, Graphic, Digital Marketing ও আরও অনেক কিছু।" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category = "", q = "" } = await searchParams;
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  params.set("limit", "60");
  const [categories, courses] = await Promise.all([serverGet<Category[]>("/public/categories", 60), serverGet<Course[]>(`/public/courses?${params}`, 30)]);
  const current = categories?.find((c) => c.slug === category);

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container py-14 text-center">
          <span className="eyebrow">কোর্সসমূহ</span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{current ? current.name : "আপনার পছন্দের কোর্স খুঁজুন"}</h1>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">{current?.description || "ইন্ডাস্ট্রির চাহিদা অনুযায়ী প্রজেক্টভিত্তিক কোর্স — অভিজ্ঞ মেন্টরের সাথে।"}</p>
          <form className="mx-auto mt-8 flex max-w-lg gap-2" action="/courses">
            {category && <input type="hidden" name="category" value={category} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input name="q" defaultValue={q} placeholder="কোর্স খুঁজুন..." className="input pl-9" />
            </div>
            <button className="btn-primary">খুঁজুন</button>
          </form>
        </div>
      </section>
      <section className="container pb-20">
        <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4">
          <Link href="/courses" className={cn("btn-sm btn shrink-0 border", !category ? "border-brand bg-brand text-white" : "border-gray-200 bg-white hover:border-brand")}>
            সব
          </Link>
          {(categories || []).map((c) => (
            <Link key={c._id} href={`/courses?category=${c.slug}`} className={cn("btn-sm btn shrink-0 border", category === c.slug ? "border-brand bg-brand text-white" : "border-gray-200 bg-white hover:border-brand")}>
              {c.name}
            </Link>
          ))}
        </div>
        {courses?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((c) => (
              <CourseCard key={c._id} c={c} />
            ))}
          </div>
        ) : (
          <Empty title="কোনো কোর্স পাওয়া যায়নি" text="অন্য ক্যাটাগরি দেখুন অথবা আমাদের কল করুন।" />
        )}
      </section>
    </>
  );
}
