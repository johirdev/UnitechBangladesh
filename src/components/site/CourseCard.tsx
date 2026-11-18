import Link from "next/link";
import { Clock, BookOpen, ArrowUpRight, Users, Flame, MonitorPlay } from "lucide-react";
import type { Course, Category } from "@/lib/types";
import { money, finalPrice, discountPct, cn, bn } from "@/lib/utils";

const MODE: Record<string, string> = { offline: "অফলাইন", online: "অনলাইন", hybrid: "অনলাইন + অফলাইন" };

export default function CourseCard({ c }: { c: Course }) {
  const pct = discountPct(c);
  const cat = typeof c.category === "object" ? (c.category as Category) : null;
  const max = c.maxSeats || 0;
  const taken = Math.min(c.seatsTaken || 0, max || Infinity);
  const left = max ? Math.max(0, max - taken) : 0;
  const fill = max ? Math.round((taken / max) * 100) : 0;

  return (
    <Link
      href={`/courses/${c.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card ring-brand/0 transition duration-300 hover:-translate-y-1.5 hover:shadow-lift hover:ring-2 hover:ring-brand/30"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.thumbnail || "/images/banner/banner2.jpg"} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {cat ? <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm backdrop-blur">{cat.name}</span> : <span />}
          {pct > 0 && <span className="rounded-full bg-gradient-to-r from-rose-500 to-brand px-2.5 py-1 text-[11px] font-bold text-white shadow">{pct}% ছাড়</span>}
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[11px] font-medium text-white">
          {c.mode && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 backdrop-blur">
              <MonitorPlay className="h-3.5 w-3.5" /> {MODE[c.mode] || c.mode}
            </span>
          )}
          {!!c.enrolledCount && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 backdrop-blur">
              <Users className="h-3.5 w-3.5" /> {bn(c.enrolledCount)} জন ভর্তি
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-ink transition group-hover:text-brand-700">{c.title}</h3>
        {c.shortDescription && <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{c.shortDescription}</p>}

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-soft">
          {c.duration && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
              <Clock className="h-3.5 w-3.5 text-brand" /> {c.duration}
            </span>
          )}
          {!!c.totalClasses && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1">
              <BookOpen className="h-3.5 w-3.5 text-brand" /> {bn(c.totalClasses)}টি ক্লাস
            </span>
          )}
        </div>

        {max > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className={cn("inline-flex items-center gap-1 font-semibold", left <= Math.max(3, max * 0.2) ? "text-rose-600" : "text-ink-soft")}>
                {left <= Math.max(3, max * 0.2) && <Flame className="h-3.5 w-3.5" />}
                {left > 0 ? `মাত্র ${bn(left)}টি সিট বাকি` : "সিট পূর্ণ"}
              </span>
              <span className="text-ink-muted">
                {taken}/{max}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${Math.max(fill, 4)}%` }} />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-ink">{money(finalPrice(c))}</span>
            {pct > 0 && <span className="ml-2 text-sm text-ink-muted line-through">{money(c.price)}</span>}
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white transition duration-300 group-hover:rotate-45 group-hover:bg-brand">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
