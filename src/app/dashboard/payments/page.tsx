"use client";

import { useApi } from "@/lib/hooks";
import { PageLoader, Empty, PageHeader } from "@/components/ui";
import type { Payment } from "@/lib/types";
import Link from "next/link";
import { FileText } from "lucide-react";
import { money, fmtDate, PAY_METHODS } from "@/lib/utils";

export default function MyPayments() {
  const { data, loading } = useApi<Payment[]>("/student/payments");
  if (loading || !data) return <PageLoader />;
  const total = data.reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <PageHeader title="পেমেন্ট ইতিহাস" desc={`মোট জমা: ${money(total)}`} />
      {data.length === 0 ? (
        <Empty title="এখনো কোনো পেমেন্ট নেই" text="অফিসে বা বিকাশ/নগদে পেমেন্ট করলে অ্যাডমিন এখানে যোগ করবেন।" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>রসিদ</th><th>তারিখ</th><th>কোর্স</th><th>মাধ্যম</th><th className="text-right">টাকা</th><th /></tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p._id}>
                  <td className="font-mono text-xs">{p.receiptNo}</td>
                  <td>{fmtDate(p.paidAt)}</td>
                  <td>{p.course?.title} {p.batch?.name && <span className="text-xs text-ink-muted">({p.batch.name})</span>}</td>
                  <td>{PAY_METHODS[p.method]} {p.trxId && <span className="block text-xs text-ink-muted">{p.trxId}</span>}</td>
                  <td className="text-right font-semibold text-emerald-700">{money(p.amount)}</td>
                  <td className="text-right">{p.receiptToken && <Link href={`/receipt/${p.receiptToken}`} target="_blank" className="btn-outline btn-sm"><FileText className="h-4 w-4" /> রসিদ</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
