"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, Droplet, School, MapPin, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/lib/hooks";
import { del, errMsg } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { PageLoader, Avatar, Badge, StatCard, Confirm } from "@/components/ui";
import type { User, Enrollment, Payment, Batch, Course } from "@/lib/types";
import { money, fmtDate, ENROLL_STATUS, BATCH_STATUS, ROLE_LABEL, PAY_METHODS } from "@/lib/utils";

type D = { user: User; enrollments: Enrollment[]; payments: Payment[]; batches: Batch[]; earnings: { _id: string; title: string; amount: number; spentAt: string; batch?: Batch }[] };

export default function UserDetail() {
  const { id } = useParams<{ id: string }>() ?? ({} as { id: string });
  const router = useRouter();
  const { user: me } = useAuth();
  const { data, loading } = useApi<D>(`/admin/users/${id}`);
  const [delOpen, setDelOpen] = useState(false);
  if (loading || !data) return <PageLoader />;
  const u = data.user;
  const payable = data.enrollments.filter((e) => !["cancelled", "rejected"].includes(e.status)).reduce((s, e) => s + e.payable, 0);
  const paid = data.enrollments.reduce((s, e) => s + e.paid, 0);

  return (
    <>
      <button onClick={() => router.back()} className="btn-ghost mb-4 -ml-3"><ArrowLeft className="h-4 w-4" /> ফিরে যান</button>
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="card p-6 text-center">
          <Avatar src={u.avatar} name={u.name} size={110} className="mx-auto" />
          <h1 className="mt-4 text-xl font-bold">{u.name}</h1>
          <p className="text-sm text-ink-muted">{ROLE_LABEL[u.role]} {u.designation && `• ${u.designation}`}</p>
          {u.studentId && <p className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">{u.studentId}</p>}
          <ul className="mt-6 space-y-2.5 text-left text-sm">
            <li className="flex gap-2"><Phone className="h-4 w-4 text-brand" /> <a href={`tel:${u.phone}`}>{u.phone}</a></li>
            {u.email && <li className="flex gap-2"><Mail className="h-4 w-4 text-brand" /> {u.email}</li>}
            {u.bloodGroup && <li className="flex gap-2"><Droplet className="h-4 w-4 text-red-500" /> রক্তের গ্রুপ: {u.bloodGroup}</li>}
            {u.institute && <li className="flex gap-2"><School className="h-4 w-4 text-brand" /> {u.institute} {u.department && `(${u.department})`} {u.semester && `• ${u.semester}`}</li>}
            {u.address && <li className="flex gap-2"><MapPin className="h-4 w-4 text-brand" /> {u.address}</li>}
            {u.guardianPhone && <li>অভিভাবক: {u.fatherName} {u.guardianPhone}</li>}
            <li className="text-xs text-ink-muted">যোগদান: {fmtDate(u.createdAt)} • শেষ লগইন: {fmtDate(u.lastLoginAt, true)}</li>
          </ul>
          {me?.role === "superadmin" && u._id !== me._id && (
            <button className="btn-ghost mt-4 w-full text-red-600" onClick={() => setDelOpen(true)}><Trash2 className="h-4 w-4" /> অ্যাকাউন্ট মুছুন</button>
          )}
        </div>
        <div className="space-y-6">
          {u.role === "student" && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="মোট প্রদেয়" value={money(payable)} />
                <StatCard label="জমা" value={money(paid)} tone="green" />
                <StatCard label="বকেয়া" value={money(Math.max(0, payable - paid))} tone="red" />
              </div>
              <div className="card p-6">
                <h2 className="mb-4 font-semibold">এনরোলমেন্ট</h2>
                {!data.enrollments.length ? <p className="text-sm text-ink-muted">নেই</p> : (
                  <ul className="divide-y">
                    {data.enrollments.map((e) => (
                      <li key={e._id}>
                        <Link href={`/admin/enrollments/${e._id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-brand-700">
                          <span>{e.course?.title} <span className="text-xs text-ink-muted">• {e.batch?.name || "ব্যাচ নেই"}</span></span>
                          <span className="flex items-center gap-3"><span className="text-xs">{money(e.paid)}/{money(e.payable)}</span><Badge className={ENROLL_STATUS[e.status]?.cls}>{ENROLL_STATUS[e.status]?.label}</Badge></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {data.payments.length > 0 && (
                <div className="card p-6">
                  <h2 className="mb-4 font-semibold">পেমেন্ট</h2>
                  <ul className="divide-y">
                    {data.payments.map((p) => (
                      <li key={p._id} className="flex justify-between py-2.5 text-sm">
                        <span>{p.course?.title} <span className="text-xs text-ink-muted">• {fmtDate(p.paidAt)} • {PAY_METHODS[p.method]} • {p.receiptNo}</span></span>
                        <span className="font-semibold text-emerald-700">{money(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {u.role === "teacher" && (
            <>
              <div className="card p-6">
                <h2 className="mb-4 font-semibold">ব্যাচসমূহ</h2>
                {!data.batches.length ? <p className="text-sm text-ink-muted">কোনো ব্যাচ নেই</p> : (
                  <ul className="divide-y">
                    {data.batches.map((b) => (
                      <li key={b._id}><Link href={`/admin/batches/${b._id}`} className="flex justify-between py-2.5 text-sm hover:text-brand-700"><span>{(b.course as Course)?.title} — {b.name}</span><Badge className={BATCH_STATUS[b.status]?.cls}>{BATCH_STATUS[b.status]?.label}</Badge></Link></li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="card p-6">
                <h2 className="mb-4 font-semibold">শিক্ষককে পেমেন্ট (মোট {money(data.earnings.reduce((s, x) => s + x.amount, 0))})</h2>
                {!data.earnings.length ? <p className="text-sm text-ink-muted">এখনো কোনো পেমেন্ট নেই — &quot;খরচ / শিক্ষক পেমেন্ট&quot; থেকে যোগ করুন</p> : (
                  <ul className="divide-y">
                    {data.earnings.map((x) => (
                      <li key={x._id} className="flex justify-between py-2.5 text-sm"><span>{x.title} <span className="text-xs text-ink-muted">• {x.batch?.name} • {fmtDate(x.spentAt)}</span></span><span className="font-semibold">{money(x.amount)}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <Confirm
        open={delOpen}
        onClose={() => setDelOpen(false)}
        onConfirm={async () => {
          try {
            await del(`/admin/users/${id}`);
            toast.success("মুছে ফেলা হয়েছে");
            router.back();
          } catch (e) {
            toast.error(errMsg(e));
            setDelOpen(false);
          }
        }}
      />
    </>
  );
}
