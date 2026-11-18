import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, BookOpen, Calendar, Users, Globe, BarChart3, CheckCircle2, Wrench, FolderKanban, ChevronDown, ChevronRight, Eye, PlayCircle, Tag, Sparkles, Flame, Armchair, ArrowRight } from "lucide-react";
import { serverGet } from "@/lib/server-api";
import type { Course, Batch, Review, User, Category } from "@/lib/types";
import { money, finalPrice, discountPct, youtubeId, fmtDate, BATCH_STATUS, bn } from "@/lib/utils";
import Stars from "@/components/site/Stars";
import CourseCard from "@/components/site/CourseCard";
import { Avatar } from "@/components/ui";
import { siteUrl } from "@/lib/site-url";

type Detail = Course & { batches: Batch[]; reviews: Review[]; rating: { avg: number; count: number }; related: Course[]; seats?: { enrolled: number; taken: number; max: number } };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await serverGet<Detail>(`/public/courses/${encodeURIComponent(slug)}`, 60);
  if (!c) return { title: "কোর্স পাওয়া যায়নি" };
  return { title: c.title, description: c.shortDescription, openGraph: { images: c.thumbnail ? [c.thumbnail] : [] } };
}

const MODE: Record<string, string> = { offline: "অফলাইন (ক্যাম্পাসে)", online: "অনলাইন", hybrid: "অনলাইন + অফলাইন" };

export default async function CourseDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await serverGet<Detail>(`/public/courses/${encodeURIComponent(slug)}`, 30);
  if (!c) notFound();
  const pct = discountPct(c);
  const vid = youtubeId(c.introVideo);
  const cat = c.category as Category;
  const instructors = (c.instructors || []) as User[];

  const info = [
    { icon: Clock, label: "মেয়াদ", value: c.duration },
    { icon: BookOpen, label: "মোট ক্লাস", value: c.totalClasses ? `${bn(c.totalClasses)}টি` : "" },
    { icon: Calendar, label: "ক্লাস শিডিউল", value: c.classSchedule },
    { icon: Globe, label: "মাধ্যম", value: MODE[c.mode || ""] },
    { icon: BarChart3, label: "লেভেল", value: c.level },
    { icon: Users, label: "ভাষা", value: c.language },
  ].filter((x) => x.value);

  const enrollHref = `/enroll/${c.slug}`;
  const seats = c.seats || { enrolled: 0, taken: 0, max: 0 };
  // -1 = সীমাহীন সিট
  const seatsLeft = seats.max > 0 ? Math.max(0, seats.max - seats.taken) : -1;
  const seatPct = seats.max > 0 ? Math.min(100, Math.round((seats.taken / seats.max) * 100)) : 0;
  const almostFull = seats.max > 0 && seatsLeft <= Math.max(3, Math.round(seats.max * 0.2));
  const canEnroll = !!c.enrollmentOpen && seatsLeft !== 0;

  // পাশের "এই পেজে" লিংক — যে অংশে কনটেন্ট আছে শুধু সেগুলো
  const nav = [
    { id: "batches", label: "ব্যাচসমূহ", on: c.batches.length > 0 },
    { id: "features", label: "যা যা পাচ্ছেন", on: !!c.features?.length },
    { id: "curriculum", label: "কারিকুলাম", on: !!c.curriculum?.length },
    { id: "instructors", label: "ইন্সট্রাক্টর", on: instructors.length > 0 },
    { id: "faq", label: "সাধারণ জিজ্ঞাসা", on: !!c.faqs?.length },
    { id: "reviews", label: "রিভিউ", on: c.reviews.length > 0 },
  ].filter((n) => n.on);

  // Google এ কোর্সের দাম ও রেটিংসহ রিচ রেজাল্টের জন্য
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: c.shortDescription || c.title,
    provider: { "@type": "Organization", name: "Unitech Bangladesh", sameAs: siteUrl },
    ...(c.thumbnail ? { image: c.thumbnail.startsWith("http") ? c.thumbnail : `${siteUrl}${c.thumbnail}` } : {}),
    offers: { "@type": "Offer", price: finalPrice(c), priceCurrency: "BDT", category: "Paid", availability: canEnroll ? "https://schema.org/InStock" : "https://schema.org/SoldOut" },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: c.mode === "online" ? "Online" : c.mode === "hybrid" ? "Blended" : "Onsite", courseWorkload: c.duration || undefined },
    ...(c.rating.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: c.rating.avg, ratingCount: c.rating.count } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* হেডার / ব্যানার */}
      <section className="relative overflow-hidden bg-ink text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.thumbnail || "/images/banner/banner2.jpg"} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/95 to-brand-900/80" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-rose-500/10 blur-3xl" />

        <div className="container relative grid gap-10 py-12 lg:grid-cols-[1fr_400px] lg:py-20">
          <div className="min-w-0 lg:self-center">
            <nav className="flex flex-wrap items-center gap-2 text-sm text-white/60">
              <Link href="/courses" className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10 transition hover:text-brand">কোর্স</Link>
              {cat?.name && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <Link href={`/courses?category=${cat.slug}`} className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10 transition hover:text-brand">{cat.name}</Link>
                </>
              )}
            </nav>

            <div className="mt-6 flex flex-wrap gap-2">
              {canEnroll ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  ভর্তি চলছে
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/30">
                  {seatsLeft === 0 ? "সব সিট পূর্ণ" : "ভর্তি বন্ধ"}
                </span>
              )}
              {c.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold text-brand-200 ring-1 ring-brand/40">
                  <Sparkles className="h-3.5 w-3.5" /> জনপ্রিয়
                </span>
              )}
              {pct > 0 && <span className="rounded-full bg-gradient-to-r from-rose-500 to-brand px-3 py-1 text-xs font-bold text-white">{pct}% ছাড়</span>}
            </div>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">{c.title}</h1>
            {c.shortDescription && <p className="mt-4 max-w-2xl text-lg text-white/70">{c.shortDescription}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/80">
              {c.rating.count > 0 && (
                <span className="inline-flex items-center gap-2">
                  <Stars value={c.rating.avg} /> <b className="text-white">{c.rating.avg}</b> ({c.rating.count} রিভিউ)
                </span>
              )}
              {!!c.views && (
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> {bn(c.views.toLocaleString())} বার দেখা হয়েছে
                </span>
              )}
              {instructors[0] && (
                <span className="inline-flex items-center gap-2">
                  <span className="flex -space-x-2">
                    {instructors.slice(0, 3).map((i) => (
                      <Avatar key={i._id} src={i.avatar} name={i.name} size={28} className="ring-2 ring-ink" />
                    ))}
                  </span>
                  {instructors.map((i) => i.name).join(", ")}
                </span>
              )}
            </div>

            {/* মূল তথ্য */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Users, label: "ইতিমধ্যে ভর্তি", value: `${bn(seats.enrolled)} জন` },
                { icon: Armchair, label: "সর্বোচ্চ সিট", value: seats.max ? `${bn(seats.max)}টি` : "সীমাহীন" },
                { icon: Clock, label: "মেয়াদ", value: c.duration || "—" },
                { icon: BookOpen, label: "মোট ক্লাস", value: c.totalClasses ? `${bn(c.totalClasses)}টি` : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/10">
                  <Icon className="h-5 w-5 text-brand" />
                  <p className="mt-3 text-lg font-bold leading-none text-white">{value}</p>
                  <p className="mt-1.5 text-xs text-white/60">{label}</p>
                </div>
              ))}
            </div>

            {/* সিট প্রগ্রেস */}
            {seats.max > 0 && (
              <div className="mt-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <p className="text-sm text-white/80">
                    এই ইনটেকে <b className="text-white">{bn(seats.taken)} জন</b> সিট নিশ্চিত করেছেন • মোট সিট <b className="text-white">{bn(seats.max)}টি</b>
                  </p>
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${almostFull ? "text-rose-300" : "text-emerald-300"}`}>
                    {almostFull && <Flame className="h-4 w-4" />}
                    {seatsLeft > 0 ? `মাত্র ${bn(seatsLeft)}টি সিট বাকি` : "সব সিট পূর্ণ"}
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-300 via-brand to-rose-500" style={{ width: `${Math.max(seatPct, 3)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* প্রাইস কার্ড */}
          <aside className="lg:row-span-2">
            <div className="overflow-hidden rounded-3xl bg-white text-ink shadow-2xl ring-1 ring-black/5 lg:sticky lg:top-24">
              <div className="relative aspect-video bg-gray-900">
                {vid ? (
                  <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${vid}`} title={c.title} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnail || "/images/banner/banner2.jpg"} alt={c.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-6">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold tracking-tight text-ink">{money(finalPrice(c))}</span>
                  {pct > 0 && (
                    <>
                      <span className="pb-1 text-ink-muted line-through">{money(c.price)}</span>
                      <span className="mb-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">{pct}% ছাড়</span>
                    </>
                  )}
                </div>
                {c.offerText && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
                    <Tag className="h-4 w-4" /> {c.offerText}
                    {c.offerEndsAt && ` — ${fmtDate(c.offerEndsAt)} পর্যন্ত`}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-ink">
                    <Users className="h-4 w-4 text-brand-600" /> {bn(seats.enrolled)} জন ভর্তি হয়েছেন
                  </span>
                  {seats.max > 0 && <span className="font-semibold text-brand-700">{seatsLeft > 0 ? `${bn(seatsLeft)}/${bn(seats.max)} সিট বাকি` : "সিট পূর্ণ"}</span>}
                </div>
                {canEnroll ? (
                  <Link href={enrollHref} className="btn-primary mt-5 w-full rounded-xl py-3.5 text-base shadow-lift">
                    এখনই ভর্তি হোন <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button disabled className="btn-dark mt-5 w-full py-3">
                    {seatsLeft === 0 ? "সব সিট পূর্ণ" : "এই মুহূর্তে ভর্তি বন্ধ"}
                  </button>
                )}
                <p className="mt-2 text-center text-xs text-ink-muted">প্রোমো কোড থাকলে ভর্তি পেজে ব্যবহার করুন</p>
                <ul className="mt-5 space-y-3 border-t pt-5 text-sm">
                  {info.map(({ icon: Icon, label, value }) => (
                    <li key={label} className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-ink-muted">
                        <Icon className="h-4 w-4 text-brand" /> {label}
                      </span>
                      <span className="text-right font-medium">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="container grid gap-10 py-12 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-12">
          {/* আসন্ন ব্যাচ */}
          {c.batches.length > 0 && (
            <section id="batches" className="scroll-mt-28">
              <h2 className="text-2xl font-bold">ভর্তি চলছে — ব্যাচসমূহ</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {c.batches.map((b) => {
                  const lim = b.seatLimit || 0;
                  const got = b.enrolled || 0;
                  const full = lim > 0 && got >= lim;
                  return (
                    <div key={b._id} className="card p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{b.name}</h3>
                        <span className={`badge ${BATCH_STATUS[b.status]?.cls}`}>{BATCH_STATUS[b.status]?.label}</span>
                      </div>
                      <p className="mt-2 text-sm text-ink-muted">শুরু: {fmtDate(b.startDate)}</p>
                      {b.schedule && <p className="text-sm text-ink-muted">সময়: {b.schedule}</p>}
                      {!!b.fee && <p className="mt-1 text-sm font-semibold text-brand-700">ফি: {money(b.fee)}</p>}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-ink-soft">{bn(got)} জন ভর্তি</span>
                          <span className="font-medium text-ink-muted">{lim ? `${bn(Math.max(0, lim - got))}/${bn(lim)} সিট খালি` : "সীমাহীন সিট"}</span>
                        </div>
                        {lim > 0 && (
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${Math.max(3, Math.min(100, Math.round((got / lim) * 100)))}%` }} />
                          </div>
                        )}
                      </div>
                      {full ? (
                        <button disabled className="btn-outline btn-sm mt-4">
                          সিট পূর্ণ
                        </button>
                      ) : (
                        <Link href={`${enrollHref}?batch=${b._id}`} className="btn-outline btn-sm mt-4">
                          এই ব্যাচে ভর্তি
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {c.features && c.features.length > 0 && (
            <section id="features" className="scroll-mt-28">
              <h2 className="text-2xl font-bold">এই কোর্সে যা যা পাচ্ছেন</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {c.features.map((f) => (
                  <li key={f} className="flex gap-2.5 rounded-xl bg-brand-50/60 p-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" /> {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {c.description && (
            <section>
              <h2 className="text-2xl font-bold">কোর্স সম্পর্কে</h2>
              <div className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">{c.description}</div>
            </section>
          )}

          {c.tools && c.tools.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Wrench className="h-6 w-6 text-brand" /> যেসব টুলস শেখানো হবে
              </h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {c.tools.map((t) => (
                  <span key={t.name} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm">
                    {t.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.icon} alt="" className="h-6 w-6 object-contain" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-brand" />
                    )}
                    {t.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {c.projects && c.projects.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <FolderKanban className="h-6 w-6 text-brand" /> যেসব প্রজেক্ট করানো হবে
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {c.projects.map((p, i) => (
                  <div key={i} className="card overflow-hidden">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.title} className="aspect-video w-full object-cover" loading="lazy" />
                    )}
                    <div className="flex gap-3 p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">{i + 1}</span>
                      <div>
                        <h3 className="font-semibold">{p.title}</h3>
                        {p.description && <p className="mt-1 text-sm text-ink-muted">{p.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {c.curriculum && c.curriculum.length > 0 && (
            <section id="curriculum" className="scroll-mt-28">
              <h2 className="text-2xl font-bold">কোর্স কারিকুলাম</h2>
              <div className="mt-5 divide-y overflow-hidden rounded-2xl border">
                {c.curriculum.map((m, i) => (
                  <details key={i} className="group" open={i === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-white px-5 py-4 font-semibold hover:bg-gray-50">
                      <span>
                        <span className="mr-2 text-brand-600">মডিউল {bn(i + 1)}:</span>
                        {m.title}
                      </span>
                      <span className="flex items-center gap-2 text-xs font-normal text-ink-muted">
                        {bn(m.lessons.length)}টি লেসন <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                      </span>
                    </summary>
                    <ul className="space-y-2 bg-gray-50/60 px-5 py-4">
                      {m.lessons.map((l, j) => (
                        <li key={j} className="flex gap-2 text-sm text-ink-soft">
                          <PlayCircle className="h-4 w-4 shrink-0 text-brand" /> {l}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          )}

          {c.videos && c.videos.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold">ভিডিও</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {c.videos.map((v, i) =>
                  youtubeId(v.url) ? (
                    <div key={i}>
                      <div className="aspect-video overflow-hidden rounded-xl bg-gray-900">
                        <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${youtubeId(v.url)}`} title={v.title} allowFullScreen loading="lazy" />
                      </div>
                      <p className="mt-2 text-sm font-medium">{v.title}</p>
                    </div>
                  ) : null,
                )}
              </div>
            </section>
          )}

          {c.images && c.images.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold">ছবি</h2>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                {c.images.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
                ))}
              </div>
            </section>
          )}

          {((c.whoFor && c.whoFor.length > 0) || (c.requirements && c.requirements.length > 0)) && (
            <section className="grid gap-6 md:grid-cols-2">
              {c.whoFor && c.whoFor.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-bold">কোর্সটি কাদের জন্য</h3>
                  <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                    {c.whoFor.map((w) => (
                      <li key={w} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> {w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {c.requirements && c.requirements.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-bold">যা যা লাগবে</h3>
                  <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                    {c.requirements.map((w) => (
                      <li key={w} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {instructors.length > 0 && (
            <section id="instructors" className="scroll-mt-28">
              <h2 className="text-2xl font-bold">ইন্সট্রাক্টর</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {instructors.map((i) => (
                  <div key={i._id} className="card flex gap-4 p-5">
                    <Avatar src={i.avatar} name={i.name} size={64} />
                    <div>
                      <h3 className="font-semibold">{i.name}</h3>
                      {i.designation && <p className="text-sm text-brand-700">{i.designation}</p>}
                      {i.bio && <p className="mt-1 text-sm text-ink-muted">{i.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {c.faqs && c.faqs.length > 0 && (
            <section id="faq" className="scroll-mt-28">
              <h2 className="text-2xl font-bold">সাধারণ জিজ্ঞাসা</h2>
              <div className="mt-5 space-y-3">
                {c.faqs.map((f, i) => (
                  <details key={i} className="group rounded-xl border bg-white p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                      {f.q} <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-sm text-ink-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {c.reviews.length > 0 && (
            <section id="reviews" className="scroll-mt-28">
              <h2 className="text-2xl font-bold">শিক্ষার্থীদের রিভিউ</h2>
              <div className="mt-5 space-y-4">
                {c.reviews.map((r) => (
                  <div key={r._id} className="card p-5">
                    <div className="flex items-center gap-3">
                      <Avatar src={r.student?.avatar} name={r.student?.name} size={40} />
                      <div>
                        <p className="font-semibold">{r.student?.name}</p>
                        <Stars value={r.rating} size={14} />
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">{r.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        {/* ডেস্কটপে পাশে — স্ক্রল করলেও দাম ও ভর্তি বাটন চোখের সামনে থাকে */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <div className="card p-5">
              <p className="line-clamp-2 text-sm font-semibold text-ink">{c.title}</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-extrabold text-ink">{money(finalPrice(c))}</span>
                {pct > 0 && <span className="pb-0.5 text-sm text-ink-muted line-through">{money(c.price)}</span>}
              </div>
              {seats.max > 0 && seatsLeft > 0 && <p className={`mt-1 text-xs font-medium ${almostFull ? "text-rose-600" : "text-ink-muted"}`}>মাত্র {bn(seatsLeft)}টি সিট বাকি</p>}
              {canEnroll ? (
                <Link href={enrollHref} className="btn-primary mt-4 w-full rounded-xl py-3">
                  এখনই ভর্তি হোন <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button disabled className="btn-dark mt-4 w-full py-3">{seatsLeft === 0 ? "সব সিট পূর্ণ" : "এই মুহূর্তে ভর্তি বন্ধ"}</button>
              )}
            </div>
            {nav.length > 1 && (
              <nav className="card p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">এই পেজে</p>
                <ul className="space-y-1 text-sm">
                  {nav.map((n) => (
                    <li key={n.id}>
                      <a href={`#${n.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-ink-soft transition hover:bg-brand-50 hover:text-brand-700">
                        <ChevronRight className="h-3.5 w-3.5 text-brand" /> {n.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </aside>
      </div>

      {c.related.length > 0 && (
        <section className="bg-gray-50 py-14">
          <div className="container">
            <h2 className="text-2xl font-bold">সম্পর্কিত কোর্স</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {c.related.map((r) => (
                <CourseCard key={r._id} c={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* মোবাইলে নিচে ভর্তি বাটন */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t bg-white p-3 shadow-2xl lg:hidden">
        <div>
          <p className="text-lg font-bold text-brand-700">{money(finalPrice(c))}</p>
          {pct > 0 && <p className="text-xs text-ink-muted line-through">{money(c.price)}</p>}
        </div>
        {canEnroll && (
          <Link href={enrollHref} className="btn-primary px-6">
            ভর্তি হোন
          </Link>
        )}
      </div>
    </>
  );
}
