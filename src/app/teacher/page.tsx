"use client";

import Link from "next/link";
import { Layers, PlayCircle, Users, Wallet, CalendarClock } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { PageLoader, StatCard, Empty, Badge, PageHeader } from "@/components/ui";
import type { Batch, Course } from "@/lib/types";
import { money, fmtDate, BATCH_STATUS } from "@/lib/utils";

type D = { batches: Batch[]; stats: { totalBatches: number; running: number; upcoming: number; completed: number; students: number; totalEarned: number } };

export default function TeacherHome() {
  const { data, loading } = useApi<D>("/teacher/overview");
  if (loading || !data) return <PageLoader />;
  const s = data.stats;
  return (
    <>
      <PageHeader title="শিক্ষক ড্যাশবোর্ড" desc="আপনার ব্যাচ, শিক্ষার্থী ও পেমেন্ট" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="মোট ব্যাচ" value={s.totalBatches} icon={<Layers className="h-5 w-5" />} />
        <StatCard label="চলমান ব্যাচ" value={s.running} icon={<PlayCircle className="h-5 w-5" />} tone="green" hint={`আসন্ন ${s.upcoming} • সম্পন্ন ${s.completed}`} />
        <StatCard label="মোট শিক্ষার্থী" value={s.students} icon={<Users className="h-5 w-5" />} tone="blue" />
        <StatCard label="মোট পেয়েছেন" value={money(s.totalEarned)} icon={<Wallet className="h-5 w-5" />} tone="purple" />
      </div>
      <h2 className="mb-4 mt-8 text-lg font-semibold">আমার ব্যাচসমূহ</h2>
      {data.batches.length === 0 ? (
        <Empty title="এখনো কোনো ব্যাচ দেওয়া হয়নি" text="অ্যাডমিন ব্যাচে আপনাকে শিক্ষক হিসেবে যোগ করলে এখানে দেখাবে।" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.batches.map((b) => (
            <Link key={b._id} href={`/teacher/batches/${b._id}`} className="card p-5 transition hover:shadow-lift">
              <div className="flex items-center justify-between">
                <Badge className={BATCH_STATUS[b.status]?.cls}>{BATCH_STATUS[b.status]?.label}</Badge>
                <span className="text-xs text-ink-muted">{b.code}</span>
              </div>
              <p className="mt-3 font-semibold">{(b.course as Course)?.title}</p>
              <p className="text-sm text-brand-700">{b.name}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                <CalendarClock className="h-4 w-4" /> {fmtDate(b.startDate)} {b.schedule && `• ${b.schedule}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
