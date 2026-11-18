"use client";

import Link from "next/link";
import { Calendar, Clock, MapPin, User as UserIcon } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { PageLoader, Empty, Badge, PageHeader } from "@/components/ui";
import type { Enrollment, User } from "@/lib/types";
import { money, fmtDate, ENROLL_STATUS, BATCH_STATUS } from "@/lib/utils";

export default function MyCourses() {
  const { data, loading } = useApi<Enrollment[]>("/student/enrollments");
  if (loading || !data) return <PageLoader />;
  return (
    <>
      <PageHeader title="আমার কোর্স" desc="ভর্তি হওয়া সব কোর্স, ব্যাচ ও পেমেন্টের অবস্থা" />
      {data.length === 0 ? (
        <Empty title="কোনো কোর্স নেই" action={<Link href="/courses" className="btn-primary">কোর্স দেখুন</Link>} />
      ) : (
        <div className="space-y-4">
          {data.map((e) => {
            const due = e.payable - e.paid;
            const pct = e.payable ? Math.round((e.paid / e.payable) * 100) : 100;
            const teachers = (e.batch?.teachers || []) as User[];
            return (
              <div key={e._id} className="card grid gap-5 p-5 md:grid-cols-[180px_1fr_240px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.course?.thumbnail || "/images/banner/banner2.jpg"} alt="" className="aspect-video w-full rounded-xl object-cover md:aspect-[4/3]" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={ENROLL_STATUS[e.status]?.cls}>{ENROLL_STATUS[e.status]?.label}</Badge>
                    {e.batch && <Badge className={BATCH_STATUS[e.batch.status]?.cls}>ব্যাচ: {BATCH_STATUS[e.batch.status]?.label}</Badge>}
                  </div>
                  <Link href={`/courses/${e.course?.slug}`} className="mt-2 block text-lg font-semibold hover:text-brand-700">
                    {e.course?.title}
                  </Link>
                  <ul className="mt-3 grid gap-1.5 text-sm text-ink-muted sm:grid-cols-2">
                    <li className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> {e.batch?.name || "ব্যাচ নির্ধারণ বাকি"}</li>
                    {e.batch?.startDate && <li className="flex items-center gap-2"><Calendar className="h-4 w-4" /> শুরু {fmtDate(e.batch.startDate)}</li>}
                    {e.batch?.schedule && <li className="flex items-center gap-2"><Clock className="h-4 w-4" /> {e.batch.schedule}</li>}
                    {e.batch?.room && <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {e.batch.room}</li>}
                  </ul>
                  {teachers.length > 0 && <p className="mt-2 text-sm">শিক্ষক: {teachers.map((t) => t.name).join(", ")}</p>}
                  <p className="mt-2 text-xs text-ink-muted">ভর্তির তারিখ: {fmtDate(e.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 text-sm">
                  <div className="flex justify-between"><span className="text-ink-muted">মোট ফি</span><span>{money(e.payable)}</span></div>
                  <div className="mt-1 flex justify-between"><span className="text-ink-muted">জমা</span><span className="text-emerald-700">{money(e.paid)}</span></div>
                  <div className="mt-1 flex justify-between font-semibold"><span>বকেয়া</span><span className={due > 0 ? "text-red-600" : "text-emerald-700"}>{money(due)}</span></div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs text-ink-muted">{pct}% পরিশোধিত</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
