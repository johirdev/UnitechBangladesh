"use client";

import { useState } from "react";
import { Printer, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { PageHeader, PageLoader, StatCard } from "@/components/ui";
import IncomeChart from "@/components/admin/IncomeChart";
import { money, PAY_METHODS, EXPENSE_TYPES } from "@/lib/utils";

type R = {
  income: number;
  expense: number;
  profit: number;
  byCourse: { _id: string; title: string; total: number; count: number }[];
  byBatch: { _id: string; name: string; course?: string; total: number }[];
  byMethod: { _id: string; total: number; count: number }[];
  expByType: { _id: string; total: number; count: number }[];
  teacherPay: { _id: string; name: string; total: number }[];
};

function Bars({ rows, color = "bg-brand" }: { rows: { label: string; value: number; sub?: string }[]; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-ink-muted">কোনো ডেটা নেই</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate">{r.label} {r.sub && <span className="text-xs text-ink-muted">{r.sub}</span>}</span>
            <span className="shrink-0 font-semibold">{money(r.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function FinancePage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, loading } = useApi<R>("/admin/finance/report", { from, to });
  const { data: dash } = useApi<{ finance?: { months: { month: string; income: number; expense: number }[] } }>("/admin/dashboard");

  const preset = (days: number | "month" | "year" | "all") => {
    const now = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    if (days === "all") return (setFrom(""), setTo(""));
    if (days === "month") return (setFrom(iso(new Date(now.getFullYear(), now.getMonth(), 1))), setTo(iso(now)));
    if (days === "year") return (setFrom(iso(new Date(now.getFullYear(), 0, 1))), setTo(iso(now)));
    setFrom(iso(new Date(Date.now() - (days - 1) * 86400000)));
    setTo(iso(now));
  };

  return (
    <>
      <PageHeader title="আয়-ব্যয় রিপোর্ট" desc="কোর্স, ব্যাচ, পেমেন্ট মাধ্যম ও খরচভিত্তিক পূর্ণ হিসাব-নিকাশ" actions={<button className="btn-outline no-print" onClick={() => window.print()}><Printer className="h-4 w-4" /> প্রিন্ট</button>} />
      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        {[["আজ", 1], ["৭ দিন", 7], ["৩০ দিন", 30], ["এই মাস", "month"], ["এই বছর", "year"], ["সব সময়", "all"]].map(([l, v]) => (
          <button key={String(l)} className="btn-outline btn-sm" onClick={() => preset(v as never)}>{l}</button>
        ))}
        <input className="input w-auto" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="থেকে" />
        <span className="text-ink-muted">→</span>
        <input className="input w-auto" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="পর্যন্ত" />
      </div>
      {loading || !data ? <PageLoader /> : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="মোট আয় (আদায়)" value={money(data.income)} tone="green" icon={<TrendingUp className="h-5 w-5" />} />
            <StatCard label="মোট ব্যয়" value={money(data.expense)} tone="red" icon={<TrendingDown className="h-5 w-5" />} />
            <StatCard label="নিট লাভ" value={money(data.profit)} tone={data.profit >= 0 ? "brand" : "red"} icon={<Wallet className="h-5 w-5" />} />
          </div>
          {dash?.finance && !from && !to && <div className="card p-6"><h2 className="mb-6 font-semibold">মাসভিত্তিক আয়-ব্যয় (১২ মাস)</h2><IncomeChart months={dash.finance.months} /></div>}
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="card p-6"><h2 className="mb-5 font-semibold">কোর্সভিত্তিক আয়</h2><Bars rows={data.byCourse.map((x) => ({ label: x.title, value: x.total, sub: `(${x.count}টি পেমেন্ট)` }))} /></div>
            <div className="card p-6"><h2 className="mb-5 font-semibold">ব্যাচভিত্তিক আয়</h2><Bars rows={data.byBatch.map((x) => ({ label: `${x.course || ""} — ${x.name}`, value: x.total }))} /></div>
            <div className="card p-6"><h2 className="mb-5 font-semibold">পেমেন্ট মাধ্যম</h2><Bars rows={data.byMethod.map((x) => ({ label: PAY_METHODS[x._id] || x._id, value: x.total, sub: `(${x.count})` }))} color="bg-emerald-500" /></div>
            <div className="card p-6"><h2 className="mb-5 font-semibold">খরচের খাত</h2><Bars rows={data.expByType.map((x) => ({ label: EXPENSE_TYPES[x._id] || x._id, value: x.total, sub: `(${x.count})` }))} color="bg-red-400" /></div>
            <div className="card p-6 xl:col-span-2"><h2 className="mb-5 font-semibold">শিক্ষকদের পেমেন্ট (আউট)</h2><Bars rows={data.teacherPay.map((x) => ({ label: x.name || "—", value: x.total }))} color="bg-violet-500" /></div>
          </div>
        </div>
      )}
    </>
  );
}
