import Link from "next/link";
import { ArrowRight, ArrowUpRight, Target, Users, BookOpen, Layers, Briefcase, MonitorPlay, ListChecks, LineChart, GraduationCap, Headphones, BadgeCheck, MapPin, Phone, Mail, Building2, Quote, Trophy } from "lucide-react";
import { serverGet } from "@/lib/server-api";
import type { Settings, Banner, Category, Course, GalleryItem, Topper, Attachment, Review, Architectural } from "@/lib/types";
import HeroSlider from "@/components/site/HeroSlider";
import CourseCard from "@/components/site/CourseCard";
import GalleryGrid from "@/components/site/GalleryGrid";
import Stars from "@/components/site/Stars";
import { Avatar } from "@/components/ui";
import { bn } from "@/lib/utils";

type Home = {
  settings: Settings | null;
  banners: Banner[];
  categories: Category[];
  courses: Course[];
  gallery: GalleryItem[];
  toppers: Topper[];
  attachments: Attachment[];
  reviews: Review[];
  architectural: (Pick<Architectural, "hero" | "services" | "projects">) | null;
};

function SectionHead({ eyebrow, title, desc, action }: { eyebrow: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="h2 mt-3">{title}</h2>
        {desc && <p className="mt-3 text-ink-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

const TONES = [
  { tile: "bg-brand-50 text-brand-600 ring-brand-100", wash: "from-brand-50 to-white", pill: "bg-brand-50 text-brand-700" },
  { tile: "bg-sky-50 text-sky-600 ring-sky-100", wash: "from-sky-50 to-white", pill: "bg-sky-50 text-sky-700" },
  { tile: "bg-emerald-50 text-emerald-600 ring-emerald-100", wash: "from-emerald-50 to-white", pill: "bg-emerald-50 text-emerald-700" },
  { tile: "bg-violet-50 text-violet-600 ring-violet-100", wash: "from-violet-50 to-white", pill: "bg-violet-50 text-violet-700" },
  { tile: "bg-rose-50 text-rose-600 ring-rose-100", wash: "from-rose-50 to-white", pill: "bg-rose-50 text-rose-700" },
  { tile: "bg-amber-50 text-amber-600 ring-amber-100", wash: "from-amber-50 to-white", pill: "bg-amber-50 text-amber-700" },
];

const FEATURES = [
  { icon: MonitorPlay, title: "লাইভ ইন্টারেক্টিভ ক্লাস", text: "অভিজ্ঞ ইন্সট্রাক্টরের সাথে সরাসরি প্রশ্ন-উত্তর ও হাতে-কলমে কাজ।" },
  { icon: ListChecks, title: "মডিউলভিত্তিক স্টাডি প্ল্যান", text: "ধাপে ধাপে সাজানো সিলেবাস — শুরু থেকে প্রফেশনাল লেভেল।" },
  { icon: LineChart, title: "রিয়েল-টাইম প্রগ্রেস ট্র্যাকিং", text: "ড্যাশবোর্ডে আপনার ভর্তি, পেমেন্ট ও সার্টিফিকেট এক জায়গায়।" },
  { icon: GraduationCap, title: "ইন্ডাস্ট্রি এক্সপার্ট মেন্টর", text: "ইন্ডাস্ট্রিতে কাজ করা প্রফেশনালদের কাছ থেকে শিখুন।" },
  { icon: Briefcase, title: "জব প্লেসমেন্ট সাপোর্ট", text: "আজীবন সিভি, প্রোফাইল বিল্ডিং ও চাকরির আবেদনে সহায়তা।" },
  { icon: BadgeCheck, title: "ভেরিফায়েবল সার্টিফিকেট", text: "স্টুডেন্ট আইডি দিয়ে অনলাইনে যাচাইযোগ্য সার্টিফিকেট।" },
];

export default async function HomePage() {
  const data = await serverGet<Home>("/public/home", 30);
  const s = data?.settings;
  const stats = s?.stats || { students: "5000+", courses: "15+", batches: "200+", jobPlacement: "80%" };

  return (
    <>
      <HeroSlider banners={data?.banners || []} />

      {/* পরিসংখ্যান */}
      <section className="relative z-10 -mt-16">
        <div className="container">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-gray-100 shadow-card md:grid-cols-4">
            {[
              { icon: Users, label: "শিক্ষার্থী", value: stats.students },
              { icon: BookOpen, label: "কোর্স", value: stats.courses },
              { icon: Layers, label: "সফল ব্যাচ", value: stats.batches },
              { icon: Briefcase, label: "জব প্লেসমেন্ট", value: stats.jobPlacement },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 bg-white p-5 sm:p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ink sm:text-3xl">{value}</p>
                  <p className="text-sm text-ink-muted">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ক্যারিয়ার গোল / ক্যাটাগরি */}
      <section className="section relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
        <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="container relative">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">
              <Target className="h-3.5 w-3.5" /> ক্যারিয়ার গোল
            </span>
            <h2 className="h2 mt-4">
              আপনার লক্ষ্য বেছে নিন, <span className="whitespace-nowrap bg-gradient-to-r from-brand-500 to-rose-500 bg-clip-text text-transparent">শেখা শুরু করুন</span>
            </h2>
            <p className="mt-4 text-ink-muted">নিচের যেকোনো একটি সেক্টর বেছে নিয়ে আজই দক্ষতা অর্জনের যাত্রা শুরু করুন।</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {(data?.categories || []).map((c, i) => {
              const tone = TONES[i % TONES.length];
              return (
                <Link
                  key={c._id}
                  href={`/courses?category=${c.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white/80 p-4 shadow-card backdrop-blur transition duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-xl sm:p-6"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition duration-300 group-hover:opacity-100 ${tone.wash}`} />
                  <div className="relative flex items-start justify-between">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition duration-300 group-hover:scale-110 group-hover:-rotate-6 sm:h-16 sm:w-16 ${tone.tile}`}>
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt={c.name} className="h-9 w-9 object-contain sm:h-11 sm:w-11" loading="lazy" />
                      ) : (
                        <BookOpen className="h-7 w-7" />
                      )}
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-ink transition duration-300 group-hover:rotate-45 group-hover:border-ink group-hover:bg-ink group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <h3 className="relative mt-5 text-base font-bold text-ink sm:text-lg">{c.name}</h3>
                  {c.description && <p className="relative mt-1.5 line-clamp-2 text-xs text-ink-muted sm:text-sm">{c.description}</p>}
                  <div className="relative mt-auto pt-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${tone.pill}`}>
                      {c.courseCount ? `${bn(c.courseCount)}টি কোর্স` : "কোর্স দেখুন"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* জনপ্রিয় কোর্স */}
      {!!data?.courses?.length && (
        <section className="section relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white">
          <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-rose-100/50 blur-3xl" />
          <div className="container relative">
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <span className="eyebrow">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                  </span>
                  জনপ্রিয় কোর্স
                </span>
                <h2 className="h2 mt-4">এখন ভর্তি চলছে</h2>
                <p className="mt-3 text-ink-muted">ইন্ডাস্ট্রির চাহিদা অনুযায়ী তৈরি প্রজেক্টভিত্তিক কোর্স — সীমিত সিট, আগে এলে আগে পাবেন।</p>
              </div>
              <Link href="/courses" className="btn-dark w-fit rounded-full px-5 py-3">
                সব কোর্স দেখুন <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.courses.map((c) => (
                <CourseCard key={c._id} c={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* কেন ইউনিটেক */}
      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/misc/career.png" alt="Unitech classroom" className="w-full rounded-3xl object-cover" loading="lazy" />
            <div className="absolute -bottom-6 right-6 hidden rounded-2xl bg-white p-4 shadow-card sm:block">
              <p className="text-3xl font-bold text-brand-600">{stats.jobPlacement}</p>
              <p className="text-sm text-ink-muted">শিক্ষার্থী চাকরি/ফ্রিল্যান্সিংয়ে</p>
            </div>
          </div>
          <div>
            <span className="eyebrow">কেন ইউনিটেক</span>
            <h2 className="h2 mt-3">ইন্ডাস্ট্রি-ফোকাসড লাইভ কোর্স</h2>
            <p className="mt-3 text-ink-muted">আমাদের লক্ষ্য প্রত্যেক শিক্ষার্থীকে দক্ষ করে গড়ে তোলা — থিওরির পাশাপাশি বাস্তব প্রজেক্টে কাজের অভিজ্ঞতা।</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* কোর্স চলাকালীন মুহূর্ত */}
      {!!data?.gallery?.length && (
        <section className="section bg-gray-50">
          <div className="container">
            <SectionHead
              eyebrow="গ্যালারি"
              title="কোর্স চলাকালীন শিক্ষার্থীদের নিয়ে কিছু মুহূর্ত"
              action={
                <Link href="/gallery" className="btn-outline">
                  সব ছবি <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <GalleryGrid items={data.gallery.slice(0, 10)} />
          </div>
        </section>
      )}

      {/* সেমিস্টার টপার */}
      {!!data?.toppers?.length && (
        <section className="section">
          <div className="container">
            <SectionHead eyebrow="সেমিস্টার টপার" title="আমাদের গর্বিত শিক্ষার্থীরা" desc="কোর্সে অসাধারণ ফলাফল করা শিক্ষার্থীদের সম্মাননা।" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.toppers.map((t) => (
                <div key={t._id} className="card group overflow-hidden">
                  <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50">
                    {t.image || t.student?.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.image || t.student.avatar} alt={t.student?.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Avatar name={t.student?.name} size={120} />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white shadow">
                      <Trophy className="h-3.5 w-3.5" /> {t.title || "Topper"}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-ink">{t.student?.name}</h3>
                    <p className="text-sm text-brand-700">
                      {t.course?.title}
                      {t.batch?.name && ` • ${t.batch.name}`}
                    </p>
                    {t.project && (
                      <p className="mt-2 text-sm text-ink-muted">
                        <span className="font-medium text-ink">প্রজেক্ট:</span> {t.project}
                      </p>
                    )}
                    {t.quote && <p className="mt-2 text-sm italic text-ink-muted">“{t.quote}”</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ইন্ডাস্ট্রিয়াল এটাচমেন্ট */}
      {!!data?.attachments?.length && (
        <section className="section bg-ink text-white">
          <div className="container">
            <div className="mb-10 max-w-2xl">
              <span className="eyebrow bg-white/10 text-brand-200">ইন্ডাস্ট্রিয়াল এটাচমেন্ট</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">ডিপ্লোমা শিক্ষার্থীদের জন্য ইন্ডাস্ট্রিয়াল এটাচমেন্ট</h2>
              <p className="mt-3 text-white/70">বাস্তব কর্মপরিবেশে কাজ শিখে নিজেকে চাকরির জন্য প্রস্তুত করুন।</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {data.attachments.map((a) => (
                <div key={a._id} className="group overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <div className="aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.image || "/images/attachment/computer.jpeg"} alt={a.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    {a.department && <span className="text-xs font-semibold uppercase tracking-wider text-brand">{a.department}</span>}
                    <h3 className="mt-1 text-xl font-semibold">{a.title}</h3>
                    {a.description && <p className="mt-2 text-sm text-white/70">{a.description}</p>}
                    {a.link && (
                      <a href={a.link} target={a.link.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="btn-primary mt-5">
                        জয়েন করুন <ArrowRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* রিভিউ */}
      {!!data?.reviews?.length && (
        <section className="section">
          <div className="container">
            <SectionHead eyebrow="শিক্ষার্থীদের মতামত" title="কোর্স সম্পন্ন করা শিক্ষার্থীরা যা বলছেন" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.reviews.slice(0, 6).map((r) => (
                <figure key={r._id} className="card relative flex flex-col p-6">
                  <Quote className="absolute right-5 top-5 h-8 w-8 text-brand-100" />
                  <Stars value={r.rating} />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">{r.comment}</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                    <Avatar src={r.student?.avatar} name={r.student?.name} size={42} />
                    <div>
                      <p className="font-semibold text-ink">{r.student?.name}</p>
                      <p className="text-xs text-ink-muted">{r.course?.title}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* UNITECH Architectural — আলাদা পেজের টিজার (কনটেন্ট অ্যাডমিন থেকে) */}
      {data?.architectural && (
        <section className="section pt-0 mt-5 md:mt-[50px]">
          <div className="container">
            <div className="relative overflow-hidden rounded-[2rem] bg-ink text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.architectural.hero.background || "/images/architectural/offer.jpg"} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
              <div className="relative grid items-center gap-10 p-8 md:p-14 lg:grid-cols-[1.1fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200 ring-1 ring-white/15">
                    <Building2 className="h-4 w-4" /> {data.architectural.hero.badge || "UNITECH Architectural"}
                  </span>
                  <h2 className="mt-5 text-3xl font-bold leading-tight md:text-4xl">{data.architectural.hero.title}</h2>
                  <p className="mt-4 max-w-xl text-white/70">{data.architectural.hero.subtitle}</p>
                  {!!data.architectural.services.length && (
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {data.architectural.services.map((sv) => (
                        <li key={sv.title} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/10">
                          {sv.title}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/unitech-architectural" className="btn-primary rounded-full px-6 py-3 text-base">
                      Explore Architectural <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a href={`tel:${s?.phone || "01705100763"}`} className="btn rounded-full bg-white/10 px-6 py-3 text-base text-white ring-1 ring-white/20 hover:bg-white hover:text-ink">
                      <Phone className="h-4 w-4" /> Call now
                    </a>
                  </div>
                </div>
                {!!data.architectural.projects.length && (
                  <div className="grid grid-cols-3 gap-3">
                    {data.architectural.projects.map((p, i) => (
                      <div key={p.image + i} className={`overflow-hidden rounded-2xl ring-1 ring-white/10 ${i === 1 ? "translate-y-6" : ""}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt={p.title} loading="lazy" className="aspect-[3/4] h-full w-full object-cover transition duration-700 hover:scale-110" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* যোগাযোগ */}
      <section id="contact" className="section scroll-mt-20 bg-gray-50">
        <div className="container grid gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow">যোগাযোগ</span>
            <h2 className="h2 mt-3">আমাদের ক্যাম্পাসে আসুন</h2>
            <p className="mt-3 text-ink-muted">ভর্তি বা কোর্স সম্পর্কে যেকোনো প্রশ্নে কল করুন অথবা সরাসরি চলে আসুন।</p>
            <ul className="mt-8 space-y-5">
              {s?.address && (
                <li className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-card">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">ঠিকানা</p>
                    <p className="text-sm text-ink-muted">{s.address}</p>
                  </div>
                </li>
              )}
              <li className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-card">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">ফোন</p>
                  <p className="text-sm text-ink-muted">
                    {s?.phone}
                    {s?.phone2 && `, ${s.phone2}`}
                  </p>
                </div>
              </li>
              {s?.email && (
                <li className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-card">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">ইমেইল</p>
                    <p className="text-sm text-ink-muted">{s.email}</p>
                  </div>
                </li>
              )}
              <li className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-card">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">অফিস সময়</p>
                  <p className="text-sm text-ink-muted">শনি - বৃহস্পতি, সকাল ১০টা - রাত ৮টা</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="min-h-[320px] overflow-hidden rounded-3xl bg-white shadow-card">
            <iframe
              title="Unitech Bangladesh location"
              src={s?.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.9!2d90.3875!3d23.7575!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zRmFybWdhdGUsIERoYWth!5e0!3m2!1sen!2sbd!4v1700000000000"}
              className="h-full min-h-[320px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
