"use client";

import Link from "next/link";
import { Users, GraduationCap, BookOpen, PlayCircle, ClipboardList, Wallet, TrendingUp, TrendingDown, AlertCircle, Eye, Star } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { useAuth } from "@/components/AuthProvider";
import { PageLoader, StatCard, Badge, PageHeader } from "@/components/ui";
import type { Enrollment, Payment } from "@/lib/types";
import { money, fmtDate, ENROLL_STATUS } from "@/lib/utils";
import IncomeChart from "@/components/admin/IncomeChart";

type D = {
  counts: { students: number; teachers: number; courses: number; runningBatches: number; upcomingBatches: number; pendingEnroll: number; totalEnroll: number; pendingReviews: number };
  recentEnrollments: Enrollment[];
  finance?: { income: number; incomeMonth: number; expense: number; expenseMonth: number; profit: number; due: number; months: { month: string; income: number; expense: number }[] };
  recentPayments?: Payment[];
  visits?: { total: number; today: number; uniqueToday: number };
};

export default function AdminHome() {
  const { user } = useAuth();
  const { data, loading } = useApi<D>("/admin/dashboard");
  if (loading || !data) return <PageLoader />;
  const c = data.counts;
  const f = data.finance;

  return (
    <div className="space-y-6">
      <PageHeader title={`স্বাগতম, ${user?.name}`} desc="আজকের সংক্ষিপ্ত চিত্র" />

      {c.pendingEnroll > 0 && (
        <Link href="/admin/enrollments?status=pending" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5" /> {c.pendingEnroll} টি নতুন এনরোলমেন্ট অনুমোদনের অপেক্ষায় — দেখুন
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="শিক্ষার্থী" value={c.students} icon={<Users className="h-5 w-5" />} />
        <StatCard label="শিক্ষক" value={c.teachers} icon={<GraduationCap className="h-5 w-5" />} tone="purple" />
        <StatCard label="কোর্স" value={c.courses} icon={<BookOpen className="h-5 w-5" />} tone="blue" />
        <StatCard label="চলমান ব্যাচ" value={c.runningBatches} icon={<PlayCircle className="h-5 w-5" />} tone="green" hint={`আসন্ন ${c.upcomingBatches}টি`} />
      </div>

      {f && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="মোট আয়" value={money(f.income)} hint={`এই মাসে ${money(f.incomeMonth)}`} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
          <StatCard label="মোট ব্যয়" value={money(f.expense)} hint={`এই মাসে ${money(f.expenseMonth)}`} icon={<TrendingDown className="h-5 w-5" />} tone="red" />
          <StatCard label="নিট লাভ" value={money(f.profit)} icon={<Wallet className="h-5 w-5" />} tone="brand" />
          <StatCard label="মোট বকেয়া" value={money(f.due)} icon={<AlertCircle className="h-5 w-5" />} tone="gray" hint={<Link href="/admin/enrollments?due=true" className="text-brand-700">তালিকা দেখুন →</Link>} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {f && (
          <div className="card p-6 xl:col-span-2">
            <h2 className="mb-6 font-semibold">গত ১২ মাসের আয়-ব্যয়</h2>
            <IncomeChart months={f.months} />
          </div>
        )}
        <div className="space-y-4">
          {data.visits && (
            <div className="card p-6">
              <h2 className="flex items-center gap-2 font-semibold"><Eye className="h-5 w-5 text-brand" /> ভিজিটর</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div><p className="text-2xl font-bold">{data.visits.today}</p><p className="text-xs text-ink-muted">আজ ভিউ</p></div>
                <div><p className="text-2xl font-bold">{data.visits.uniqueToday}</p><p className="text-xs text-ink-muted">আজ ভিজিটর</p></div>
                <div><p className="text-2xl font-bold">{data.visits.total}</p><p className="text-xs text-ink-muted">মোট ভিউ</p></div>
              </div>
              <Link href="/admin/analytics" className="btn-outline btn-sm mt-4 w-full">বিস্তারিত</Link>
            </div>
          )}
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-semibold"><ClipboardList className="h-5 w-5 text-brand" /> এনরোলমেন্ট</h2>
            <p className="mt-2 text-3xl font-bold">{c.totalEnroll}</p>
            <p className="text-sm text-ink-muted">অপেক্ষমাণ {c.pendingEnroll}টি</p>
            {c.pendingReviews > 0 && (
              <Link href="/admin/reviews" className="mt-3 flex items-center gap-1.5 text-sm text-brand-700"><Star className="h-4 w-4" /> {c.pendingReviews}টি রিভিউ অনুমোদনের অপেক্ষায়</Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {data.recentEnrollments.length > 0 && (
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">সাম্প্রতিক এনরোলমেন্ট</h2>
              <Link href="/admin/enrollments" className="text-sm text-brand-700">সব</Link>
            </div>
            <ul className="divide-y">
              {data.recentEnrollments.map((e) => (
                <li key={e._id}>
                  <Link href={`/admin/enrollments/${e._id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-brand-700">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.fullName}</p>
                      <p className="truncate text-xs text-ink-muted">{e.course?.title} • {fmtDate(e.createdAt)}</p>
                    </div>
                    <Badge className={ENROLL_STATUS[e.status]?.cls}>{ENROLL_STATUS[e.status]?.label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.recentPayments && data.recentPayments.length > 0 && (
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">সাম্প্রতিক পেমেন্ট</h2>
              <Link href="/admin/payments" className="text-sm text-brand-700">সব</Link>
            </div>
            <ul className="divide-y">
              {data.recentPayments.map((p) => (
                <li key={p._id} className="flex items-center justify-between py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.student?.name}</p>
                    <p className="truncate text-xs text-ink-muted">{p.course?.title} • {fmtDate(p.paidAt)}</p>
                  </div>
                  <span className="font-semibold text-emerald-700">{money(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
