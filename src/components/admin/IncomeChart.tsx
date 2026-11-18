"use client";

import { money } from "@/lib/utils";

const MONTHS = ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

export default function IncomeChart({ months }: { months: { month: string; income: number; expense: number }[] }) {
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  return (
    <div>
      <div className="flex h-56 items-end gap-1.5 sm:gap-3">
        {months.map((m) => (
          <div key={m.month} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="flex h-full items-end justify-center gap-0.5">
              <div className="w-full max-w-[18px] rounded-t bg-brand transition group-hover:bg-brand-600" style={{ height: `${(m.income / max) * 100}%`, minHeight: m.income ? 3 : 0 }} />
              <div className="w-full max-w-[18px] rounded-t bg-gray-300" style={{ height: `${(m.expense / max) * 100}%`, minHeight: m.expense ? 3 : 0 }} />
            </div>
            <div className="pointer-events-none absolute -top-14 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-xs text-white group-hover:block">
              আয় {money(m.income)}
              <br />
              ব্যয় {money(m.expense)}
            </div>
            <p className="mt-2 text-center text-[10px] text-ink-muted sm:text-xs">{MONTHS[+m.month.slice(5) - 1]}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand" /> আয়</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gray-300" /> ব্যয়</span>
      </div>
    </div>
  );
}

