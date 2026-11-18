"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Printer } from "lucide-react";
import { useApi, useDebounced } from "@/lib/hooks";
import { PageHeader, PageLoader, Empty, Pagination, StatCard } from "@/components/ui";
import type { Payment } from "@/lib/types";
import { money, fmtDate, PAY_METHODS } from "@/lib/utils";

export default function PaymentsPage() {
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, meta, loading } = useApi<Payment[]>("/admin/payments", { q: dq, method, from, to, page, limit: 50 });

  return (
    <>
      <PageHeader title="পেমেন্ট / কালেকশন" desc="সব জমা নেওয়া টাকার তালিকা — তারিখ দিয়ে দৈনিক/মাসিক কালেকশন দেখুন" actions={<button className="btn-outline no-print" onClick={() => window.print()}><Printer className="h-4 w-4" /> প্রিন্ট</button>} />
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-9" placeholder="রসিদ নং / TrxID" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} />
        </div>
        <select className="input w-auto" value={method} onChange={(e) => (setMethod(e.target.value), setPage(1))}>
          <option value="">সব মাধ্যম</option>
          {Object.entries(PAY_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className="input w-auto" type="date" value={from} onChange={(e) => (setFrom(e.target.value), setPage(1))} aria-label="থেকে" />
        <input className="input w-auto" type="date" value={to} onChange={(e) => (setTo(e.target.value), setPage(1))} aria-label="পর্যন্ত" />
      </div>
      {meta && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <StatCard label="মোট কালেকশন (ফিল্টার অনুযায়ী)" value={money(meta.sum as number)} tone="green" />
          <StatCard label="পেমেন্ট সংখ্যা" value={meta.total} />
        </div>
      )}
      {loading && !data ? <PageLoader /> : !data?.length ? <Empty title="কোনো পেমেন্ট নেই" /> : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>রসিদ</th><th>তারিখ</th><th>শিক্ষার্থী</th><th>কোর্স / ব্যাচ</th><th>মাধ্যম</th><th>গ্রহণকারী</th><th className="text-right">টাকা</th></tr></thead>
            <tbody>
              {data.map((p) => (
                <tr key={p._id}>
                  <td className="font-mono text-xs"><Link href={`/admin/enrollments/${p.enrollment}`} className="hover:text-brand-700">{p.receiptNo}</Link></td>
                  <td className="whitespace-nowrap">{fmtDate(p.paidAt)}</td>
                  <td>{p.student?.name}<span className="block text-xs text-ink-muted">{p.student?.phone}</span></td>
                  <td className="text-sm">{p.course?.title}<span className="block text-xs text-ink-muted">{p.batch?.name}</span></td>
                  <td>{PAY_METHODS[p.method]}{p.trxId && <span className="block text-xs text-ink-muted">{p.trxId}</span>}</td>
                  <td className="text-xs">{p.receivedBy?.name}</td>
                  <td className="text-right font-semibold text-emerald-700">{money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && <Pagination page={meta.page} pages={meta.pages} onChange={setPage} />}
    </>
  );
}
