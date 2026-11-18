"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, PlayCircle } from "lucide-react";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/utils";

const FALLBACK: Banner[] = [{ _id: "f", title: "দক্ষ হবো ইউনিটেক এর সাথে", subtitle: "ডিপ্লোমা সেমিস্টার ও স্কিল কোর্স", image: "/images/banner/banner2.jpg", buttonText: "কোর্স দেখুন", buttonLink: "/courses" }];

export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const slides = banners.length ? banners : FALLBACK;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const go = (d: number) => setI((x) => (x + d + slides.length) % slides.length);

  return (
    <section className="relative isolate overflow-hidden bg-ink" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      <div className="relative h-[560px] sm:h-[600px] lg:h-[640px]">
        {slides.map((b, idx) => (
          <div key={b._id} className={cn("absolute inset-0 transition-opacity duration-1000", idx === i ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={idx !== i}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt={b.title || ""} className={cn("absolute inset-0 h-full w-full object-cover", idx === i && "animate-kenburns")} fetchPriority={idx === 0 ? "high" : "low"} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="container relative flex h-full items-center">
              {idx === i && (
                <div className="max-w-2xl animate-fadeUp text-white">
                  <span className="eyebrow bg-brand/20 text-brand-200 ring-1 ring-brand/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Unitech Bangladesh
                  </span>
                  {b.title && <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{b.title}</h1>}
                  {b.subtitle && <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{b.subtitle}</p>}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={b.buttonLink || "/courses"} className="btn-primary px-6 py-3 text-base shadow-lift">
                      {b.buttonText || "কোর্স দেখুন"} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/verify-certificate" className="btn border border-white/30 px-6 py-3 text-base text-white backdrop-blur hover:bg-white/10">
                      <PlayCircle className="h-4 w-4" /> সার্টিফিকেট যাচাই
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-28">
            {slides.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)} aria-label={`স্লাইড ${idx + 1}`} className={cn("h-1.5 rounded-full transition-all", idx === i ? "w-8 bg-brand" : "w-3 bg-white/50 hover:bg-white")} />
            ))}
          </div>
          <button onClick={() => go(-1)} aria-label="আগের" className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-brand md:flex">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => go(1)} aria-label="পরের" className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-brand md:flex">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </section>
  );
}
