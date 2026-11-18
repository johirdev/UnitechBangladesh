"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, Wallet, AlertCircle, Receipt, TrendingUp, ClipboardList } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { useAuth, can } from "@/components/AuthProvider";
import { PageLoader, StatCard, Badge, PageHeader, Empty } from "@/components/ui";
import EnrollmentTable from "@/components/admin/EnrollmentTable";
import type { Batch, Course, Enrollment, Payment, User } from "@/lib/types";
import { money, fmtDate, BATCH_STATUS, EXPENSE_TYPES, PAY_METHODS } from "@/lib/utils";

type D = {
  batch: Batch;
  enrollments: Enrollment[];
  payments: Payment[];
  expenses: { _id: string; title: string; type: string; amount: number; spentAt: string; teacher?: User }[];
  stats: NonNullable<Batch["stats"]>;
};

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>() ?? ({} as { id: string });
  const { user } = useAuth();
  const { data, loading, reload } = useApi<D>(`/admin/batches/${id}`);
  if (loading || !data) return <PageLoader />;
  const { batch: b, stats: s } = data;
  const course = b.course as Course;

  return (
    <>
      <Link href="/admin/batches" className="btn-ghost mb-4 -ml-3"><ArrowLeft className="h-4 w-4" /> সব ব্যাচ</Link>
      <PageHeader
        title={`${course?.title} — ${b.name}`}
        desc={`শুরু ${fmtDate(b.startDate)} ${b.endDate ? `• শেষ ${fmtDate(b.endDate)}` : ""} ${b.schedule ? `• ${b.schedule}` : ""} • শিক্ষক: ${(b.teachers as User[])?.map((t) => t.name).join(", ") || "—"}`}
        actions={<Badge className={`${BATCH_STATUS[b.status]?.cls} text-sm`}>{BATCH_STATUS[b.status]?.label}</Badge>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="শিক্ষার্থী" value={`${s.students}${b.seatLimit ? `/${b.seatLimit}` : ""}`} hint={s.pending ? `অপেক্ষমাণ ${s.pending}` : undefined} icon={<Users className="h-5 w-5" />} />
        <StatCard label="মোট প্রদেয়" value={money(s.payable)} icon={<ClipboardList className="h-5 w-5" />} tone="blue" />
        <StatCard label="আদায় (আয়)" value={money(s.collected)} icon={<Wallet className="h-5 w-5" />} tone="green" />
        <StatCard label="বকেয়া" value={money(s.due)} icon={<AlertCircle className="h-5 w-5" />} tone="red" />
        <StatCard label="লাভ (আয় − খরচ)" value={money(s.profit)} hint={`খরচ ${money(s.expense)}`} icon={<TrendingUp className="h-5 w-5" />} tone="purple" />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">শিক্ষার্থী তালিকা</h2>
      <p className="mb-3 text-sm text-ink-muted">টিক দিয়ে শিক্ষার্থী বাছাই করে ক্লাসের তারিখ-সময় বা বকেয়া রিমাইন্ডার এসএমএস পাঠান।</p>
      {data.enrollments.length ? <EnrollmentTable rows={data.enrollments.map((e) => ({ ...e, course, batch: b }))} onChange={reload} showCourse={false} canSms={can(user, "sms")} /> : <Empty title="এই ব্যাচে কেউ নেই" />}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Wallet className="h-5 w-5 text-emerald-600" /> আদায়ের তালিকা</h2>
          {!data.payments.length ? <p className="text-sm text-ink-muted">কোনো পেমেন্ট নেই</p> : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {data.payments.map((p) => (
                <li key={p._id} className="flex justify-between py-2.5 text-sm">
                  <span>{p.student?.name} <span className="text-xs text-ink-muted">• {fmtDate(p.paidAt)} • {PAY_METHODS[p.method]}</span></span>
                  <span className="font-semibold text-emerald-700">{money(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Receipt className="h-5 w-5 text-red-600" /> খরচ / শিক্ষক পেমেন্ট</h2>
            {can(user, "finance") && <Link href="/admin/expenses" className="text-sm text-brand-700">খরচ যোগ করুন →</Link>}
          </div>
          {!data.expenses.length ? <p className="text-sm text-ink-muted">কোনো খরচ যোগ হয়নি</p> : (
            <ul className="divide-y">
              {data.expenses.map((x) => (
                <li key={x._id} className="flex justify-between py-2.5 text-sm">
                  <span>{x.title} <span className="text-xs text-ink-muted">• {EXPENSE_TYPES[x.type]} {x.teacher && `• ${x.teacher.name}`} • {fmtDate(x.spentAt)}</span></span>
                  <span className="font-semibold text-red-600">{money(x.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
