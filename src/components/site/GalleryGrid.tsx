"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * মোজাইক: প্রতি ৫টা ছবিতে ১টা বড় (২x২) + ৪টা ছোট = ঠিক ২ সারি।
 * শেষে বাড়তি ১-৩টা ছবি থাকলে সেগুলো চওড়া হয়ে সারি ভরিয়ে দেয় — ফাঁকা জায়গা থাকে না।
 */
function mosaicCls(idx: number, n: number) {
  const full = n - (n % 5);
  if (idx < full) return idx % 5 === 0 ? "aspect-square md:col-span-2 md:row-span-2 md:aspect-auto" : "aspect-square md:aspect-auto";
  const tail = n % 5;
  const pos = idx - full;
  const span = tail === 1 ? "md:col-span-4" : tail === 2 ? "md:col-span-2" : tail === 3 && pos === 0 ? "md:col-span-2" : "";
  return cn(tail === 1 ? "col-span-2 aspect-[2/1]" : "aspect-square", "md:aspect-auto", span);
}

export default function GalleryGrid({ items, variant = "mosaic" }: { items: GalleryItem[]; variant?: "mosaic" | "grid" }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((x) => (x! + 1) % items.length);
      if (e.key === "ArrowLeft") setOpen((x) => (x! - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, items.length]);

  const cur = open !== null ? items[open] : null;

  return (
    <>
      <div className={cn("grid gap-3 sm:gap-4", variant === "mosaic" ? "grid-cols-2 md:grid-cols-4 md:auto-rows-[200px]" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4")}>
        {items.map((g, idx) => (
          <button
            key={g._id}
            onClick={() => setOpen(idx)}
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-gray-100 text-left",
              variant === "mosaic" ? mosaicCls(idx, items.length) : "aspect-[4/3]",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.image} alt={g.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-90" />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <p className="font-semibold text-white">{g.title}</p>
              {g.description && <p className="mt-0.5 line-clamp-2 text-xs text-white/80">{g.description}</p>}
            </div>
          </button>
        ))}
      </div>

      {cur && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="বন্ধ">
            <X className="h-6 w-6" />
          </button>
          <button className="absolute left-2 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6" onClick={(e) => (e.stopPropagation(), setOpen((open! - 1 + items.length) % items.length))} aria-label="আগের">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cur.image} alt={cur.title} className="max-h-[80vh] w-auto rounded-xl object-contain" />
            <figcaption className="mt-3 text-center text-white">
              <p className="font-semibold">{cur.title}</p>
              {cur.description && <p className="mt-1 text-sm text-white/70">{cur.description}</p>}
            </figcaption>
          </figure>
          <button className="absolute right-2 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6" onClick={(e) => (e.stopPropagation(), setOpen((open! + 1) % items.length))} aria-label="পরের">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}
