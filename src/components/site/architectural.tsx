"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Pause, Play } from "lucide-react";
import type { Architectural } from "@/lib/types";
import { cn } from "@/lib/utils";

/** স্ক্রিনে এলে একবার true হয় */
function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** স্ক্রল করলে নিচ থেকে ফেড-ইন */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.12);
  return (
    <div ref={ref} className={cn("transition duration-700 ease-out motion-reduce:transition-none", seen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** "546+" / "91%" — সংখ্যার অংশ গুনে গুনে বাড়ে, বাকি অংশ (+, %) ঠিক থাকে */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4);
  const m = value.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : NaN;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen || isNaN(target)) return;
    if (reducedMotion()) return setN(target);
    let raf = 0;
    const start = performance.now();
    const dur = 1600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, target]);
  if (!m || isNaN(target)) return <span className={className}>{value}</span>;
  const decimals = (m[2].split(".")[1] || "").length;
  return (
    <span ref={ref} className={className}>
      {m[1]}
      {seen ? n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : 0}
      {m[3]}
    </span>
  );
}

/** "Plan your home in safe hands — BDT 5000/- per floor" অফার স্লাইডার */
export function OfferSlider({ offers, phone }: { offers: Architectural["offers"]; phone?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = offers.length;
  const go = useCallback((d: number) => setI((x) => (x + d + count) % count), [count]);
  useEffect(() => {
    if (count < 2 || paused || reducedMotion()) return;
    const t = setInterval(() => go(1), 4500);
    return () => clearInterval(t);
  }, [count, paused, go]);
  if (!count) return null;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-gray-100" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="flex transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
        {offers.map((o, k) => (
          <div key={k} className="grid w-full shrink-0 items-center md:grid-cols-2" aria-hidden={k !== i}>
            <div className="relative aspect-[16/11] overflow-hidden md:aspect-auto md:h-full md:min-h-[380px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.image || "/images/architectural/offer.jpg"} alt={`${o.title} ${o.highlight}`} loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover", k === i && "motion-safe:animate-kenburns")} />
            </div>
            <div className="p-8 md:p-12">
              <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
                {o.title} <span className="bg-gradient-to-r from-brand-500 to-rose-500 bg-clip-text text-transparent">{o.highlight}</span>
              </h3>
              <div className="mt-8 flex items-end gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-ink-muted">{o.label}</p>
                  <p className="mt-1 text-4xl font-black tracking-tight text-brand-600 md:text-5xl">{o.price}</p>
                </div>
                {o.unit && <span className="mb-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">{o.unit}</span>}
              </div>
              {phone && (
                <a href={`tel:${phone}`} className="mt-8 inline-flex items-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-ink ring-1 ring-gray-200 transition hover:ring-brand">
                  <span className="bg-brand px-5 py-3 text-white">Call Now</span>
                  <span className="px-5 py-3 tracking-wide">{phone}</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      {count > 1 && (
        <>
          <div className="absolute bottom-5 right-6 flex items-center gap-2">
            {offers.map((_, k) => (
              <button key={k} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} className={cn("h-2 rounded-full transition-all", k === i ? "w-7 bg-brand" : "w-2 bg-gray-300 hover:bg-gray-400")} />
            ))}
          </div>
          <button aria-label="Previous" onClick={() => go(-1)} className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-brand hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button aria-label="Next" onClick={() => go(1)} className="absolute left-16 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-brand hover:text-white">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Our Last Projects — বড় ছবি নিজে নিজে বদলায় (ক্রসফেড + জুম), নিচে থাম্বনেইল স্ট্রিপ।
 * থাম্বনেইলে ক্লিক করলে সেটা বড় হয়ে দেখায়; মাউস রাখলে থামে।
 */
export function ProjectShowcase({ projects, interval = 3500 }: { projects: Architectural["projects"]; interval?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const strip = useRef<HTMLDivElement>(null);
  const count = projects.length;
  const go = useCallback((d: number) => setI((x) => (x + d + count) % count), [count]);
  const stopped = paused || userPaused;

  useEffect(() => {
    if (count < 2 || stopped || reducedMotion()) return;
    const t = setTimeout(() => go(1), interval);
    return () => clearTimeout(t);
  }, [i, count, stopped, go, interval]);

  // সক্রিয় থাম্বনেইল স্ট্রিপের মাঝে রাখা (পেজ স্ক্রল না করে)
  useEffect(() => {
    const el = strip.current?.children[i] as HTMLElement | undefined;
    const box = strip.current;
    if (el && box) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [i]);

  if (!count) return null;
  const p = projects[i];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-gray-900 shadow-2xl ring-1 ring-black/5 sm:aspect-[16/10]">
        {projects.map((x, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={x.image + k}
            src={x.image}
            alt={x.title || `Project ${k + 1}`}
            loading={k === 0 ? "eager" : "lazy"}
            className={cn("absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1200ms] ease-out", k === i ? "scale-100 opacity-100" : "scale-110 opacity-0")}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div key={i} className="absolute inset-x-0 bottom-0 p-6 text-white motion-safe:animate-fadeUp sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
            Project {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
          {p.title && <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{p.title}</h3>}
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/80">
            {p.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand" /> {p.location}
              </span>
            )}
            {p.year && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-brand" /> {p.year}
              </span>
            )}
          </div>
        </div>

        {count > 1 && (
          <div className="absolute right-4 top-4 flex gap-2">
            <button aria-label="Previous project" onClick={() => go(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white hover:text-ink">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button aria-label={userPaused ? "Play slideshow" : "Pause slideshow"} onClick={() => setUserPaused((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white hover:text-ink">
              {userPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button aria-label="Next project" onClick={() => go(1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white hover:text-ink">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* অটোপ্লে প্রগ্রেস বার */}
        {count > 1 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <div
              key={`${i}-${stopped}`}
              className="h-full origin-left bg-brand"
              style={stopped ? { transform: "scaleX(0)" } : { animation: `progress ${interval}ms linear both` }}
            />
          </div>
        )}
      </div>

      {count > 1 && (
        <div ref={strip} className="no-scrollbar mt-4 flex snap-x gap-3 overflow-x-auto pb-1">
          {projects.map((x, k) => (
            <button
              key={x.image + k}
              onClick={() => setI(k)}
              aria-label={x.title || `Project ${k + 1}`}
              className={cn(
                "relative aspect-[4/3] w-28 shrink-0 snap-start overflow-hidden rounded-2xl ring-2 transition duration-300 sm:w-36",
                k === i ? "ring-brand ring-offset-2" : "opacity-60 ring-transparent hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.image} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** নিচের অবিরাম চলমান প্রজেক্ট স্ট্রিপ */
export function ProjectMarquee({ projects }: { projects: Architectural["projects"] }) {
  if (projects.length < 3) return null;
  const loop = [...projects, ...projects];
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max gap-4 motion-safe:animate-marquee group-hover:[animation-play-state:paused]">
        {loop.map((p, k) => (
          <figure key={k} className="relative h-48 w-64 shrink-0 overflow-hidden rounded-2xl sm:h-56 sm:w-80" aria-hidden={k >= projects.length}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-110" />
            {p.title && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-semibold text-white">{p.title}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Our Goal / Vision / History ... ট্যাব */
export function InfoTabs({ tabs }: { tabs: Architectural["tabs"] }) {
  const [i, setI] = useState(0);
  if (!tabs.length) return null;
  const t = tabs[Math.min(i, tabs.length - 1)];
  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <div role="tablist" className="no-scrollbar flex gap-2 overflow-x-auto rounded-3xl bg-gray-50 p-2 md:flex-col">
        {tabs.map((x, k) => (
          <button
            key={x.name + k}
            role="tab"
            aria-selected={k === i}
            onClick={() => setI(k)}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition md:text-base",
              k === i ? "bg-white text-ink shadow-card" : "text-ink-muted hover:bg-white/60 hover:text-ink",
            )}
          >
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition", k === i ? "bg-brand-50" : "bg-white")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {x.icon ? <img src={x.icon} alt="" className="h-6 w-6 object-contain" /> : <span className="h-2 w-2 rounded-full bg-brand" />}
            </span>
            {x.name}
            {k === i && <span className="ml-auto hidden h-6 w-1 rounded-full bg-brand md:block" />}
          </button>
        ))}
      </div>
      <div key={i} role="tabpanel" className="relative flex flex-col justify-center overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-card motion-safe:animate-fadeIn md:p-12">
        <span className="pointer-events-none absolute -right-6 -top-10 select-none text-[10rem] font-black leading-none text-gray-50">{String(i + 1).padStart(2, "0")}</span>
        <p className="relative text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">{t.name}</p>
        {t.title && <h3 className="relative mt-3 text-2xl font-bold text-ink md:text-3xl">{t.title}</h3>}
        {t.text && <p className="relative mt-4 max-w-2xl leading-relaxed text-ink-soft">{t.text}</p>}
      </div>
    </div>
  );
}
