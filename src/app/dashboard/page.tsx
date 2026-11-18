"use client";

import Link from "next/link";
import { BookOpen, Wallet, AlertCircle, Award, ArrowRight } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { useAuth } from "@/components/AuthProvider";
import { PageLoader, StatCard, Empty, Badge } from "@/components/ui";
import type { Enrollment, Payment } from "@/lib/types";
import { money, fmtDate, ENROLL_STATUS, PAY_METHODS } from "@/lib/utils";

type D = { enrollments: Enrollment[]; certificates: number; payments: Payment[]; totalPayable: number; totalPaid: number; totalDue: number };

export default function StudentHome() {
  const { user } = useAuth();
  const { data, loading } = useApi<D>("/student/dashboard");
  if (loading || !data) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden bg-gradient-to-r from-brand to-brand-600 p-6 text-white">
        <p className="text-sm text-white/80">স্বাগতম 👋</p>
        <h1 className="mt-1 text-2xl font-bold">{user?.name}</h1>
        <p className="mt-1 text-sm text-white/90">স্টুডেন্ট আইডি: {user?.studentId || "—"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="আমার কোর্স" value={data.enrollments.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="মোট জমা" value={money(data.totalPaid)} icon={<Wallet className="h-5 w-5" />} tone="green" />
        <StatCard label="বকেয়া" value={money(data.totalDue)} icon={<AlertCircle className="h-5 w-5" />} tone={data.totalDue > 0 ? "red" : "gray"} />
        <StatCard label="সার্টিফিকেট" value={data.certificates} icon={<Award className="h-5 w-5" />} tone="blue" />
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">আমার কোর্সসমূহ</h2>
          <Link href="/dashboard/courses" className="text-sm font-medium text-brand-700">
            সব দেখুন
          </Link>
        </div>
        {data.enrollments.length === 0 ? (
          <Empty
            title="এখনো কোনো কোর্সে ভর্তি হননি"
            action={
              <Link href="/courses" className="btn-primary">
                কোর্স দেখুন <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.enrollments.map((e) => (
              <div key={e._id} className="flex gap-4 rounded-xl border p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.course?.thumbnail || "/images/banner/banner2.jpg"} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.course?.title}</p>
                  <p className="text-xs text-ink-muted">
                    {e.batch?.name || "ব্যাচ নির্ধারণ বাকি"} {e.batch?.startDate && `• শুরু ${fmtDate(e.batch.startDate)}`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className={ENROLL_STATUS[e.status]?.cls}>{ENROLL_STATUS[e.status]?.label}</Badge>
                    {e.payable - e.paid > 0 ? <span className="text-xs font-medium text-red-600">বকেয়া {money(e.payable - e.paid)}</span> : <span className="text-xs font-medium text-emerald-600">পরিশোধিত</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.payments.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">সাম্প্রতিক পেমেন্ট</h2>
          <ul className="divide-y">
            {data.payments.map((p) => (
              <li key={p._id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">{p.course?.title}</p>
                  <p className="text-xs text-ink-muted">
                    {fmtDate(p.paidAt)} • {PAY_METHODS[p.method]} • রসিদ {p.receiptNo}
                  </p>
                </div>
                <span className="font-semibold text-emerald-700">{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
