"use client";

import { useApi } from "@/lib/hooks";
import { PageLoader, PageHeader, Empty } from "@/components/ui";
import type { Batch } from "@/lib/types";
import Link from "next/link";
import { FileText } from "lucide-react";
import { money, fmtDate, PAY_METHODS } from "@/lib/utils";

type E = { _id: string; title: string; amount: number; method: string; spentAt: string; batch?: Batch; note?: string; receiptToken?: string };

export default function Earnings() {
  const { data, loading } = useApi<{ list: E[]; total: number }>("/teacher/earnings");
  if (loading || !data) return <PageLoader />;
  return (
    <>
      <PageHeader title="আমার পেমেন্ট" desc={`মোট পেয়েছেন: ${money(data.total)}`} />
      {data.list.length === 0 ? (
        <Empty title="এখনো কোনো পেমেন্ট রেকর্ড নেই" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>তারিখ</th><th>বিবরণ</th><th>ব্যাচ</th><th>মাধ্যম</th><th className="text-right">টাকা</th><th /></tr>
            </thead>
            <tbody>
              {data.list.map((e) => (
                <tr key={e._id}>
                  <td>{fmtDate(e.spentAt)}</td>
                  <td>{e.title}{e.note && <span className="block text-xs text-ink-muted">{e.note}</span>}</td>
                  <td>{e.batch?.name || "—"}</td>
                  <td>{PAY_METHODS[e.method]}</td>
                  <td className="text-right font-semibold">{money(e.amount)}</td>
                  <td className="text-right">{e.receiptToken && <Link href={`/receipt/${e.receiptToken}`} target="_blank" className="btn-outline btn-sm"><FileText className="h-4 w-4" /> রসিদ</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
